/**
 * Recommendation Engine Evaluation Script
 *
 * This script evaluates the performance of the recommendation engines by:
 * 1. Generating recommendations for a set of test users
 * 2. Calculating precision, recall, and F1 score
 * 3. Comparing content-based, collaborative, and hybrid approaches
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HybridRecommendationEngine = require('./ml/hybridEngine');
const ContentBasedEngine = require('./ml/contentBasedEngine');
const CollaborativeEngine = require('./ml/collaborativeEngine');
const { DATABASE_CONFIG } = require('./config/constants');

// Initialize recommendation engines
const hybridEngine = new HybridRecommendationEngine();
const contentEngine = new ContentBasedEngine();
const collaborativeEngine = new CollaborativeEngine();

// Setup logger
const logger = {
  info: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log(message);
    }
  },
  error: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(message);
    }
  }
};

// Import models
let User, Profile, Product, Interaction;
try {
  const models = require('./models');
  User = models.User;
  Profile = models.Profile;
  Product = models.Product;
  Interaction = require('./ml/Interaction');
} catch (err) {
  logger.error(`Models import error: ${err.message}`);
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(DATABASE_CONFIG.MONGODB_URI, {
  serverSelectionTimeoutMS: DATABASE_CONFIG.DB_CONNECTION_TIMEOUT
})
  .then(() => logger.info('MongoDB connected'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Evaluation metrics
function calculatePrecision(recommendedItems, relevantItems) {
  if (recommendedItems.length === 0) return 0;

  const relevantRecommended = recommendedItems.filter(item =>
    relevantItems.some(relevant => relevant.toString() === item.toString())
  );

  return relevantRecommended.length / recommendedItems.length;
}

function calculateRecall(recommendedItems, relevantItems) {
  if (relevantItems.length === 0) return 0;

  const relevantRecommended = recommendedItems.filter(item =>
    relevantItems.some(relevant => relevant.toString() === item.toString())
  );

  return relevantRecommended.length / relevantItems.length;
}

function calculateF1Score(precision, recall) {
  if (precision + recall === 0) return 0;
  return 2 * (precision * recall) / (precision + recall);
}

// Get relevant items for a user (items they've interacted with positively)
async function getRelevantItems(userId) {
  const interactions = await Interaction.find({
    userId,
    $or: [
      { interactionType: 'purchase' },
      { interactionType: 'favorite' },
      { rating: { $gte: 4 } }
    ]
  });

  return interactions.map(interaction => interaction.productId);
}

// Evaluate recommendation engines
async function evaluateRecommendationEngines() {
  try {
    // Get all users, products, and interactions
    const users = await User.find({});
    const products = await Product.find({});
    const interactions = await Interaction.find({});

    // Build user-item matrix for collaborative filtering
    collaborativeEngine.buildUserItemMatrix(interactions);

    // Metrics storage
    const metrics = {
      content: { precision: 0, recall: 0, f1: 0 },
      collaborative: { precision: 0, recall: 0, f1: 0 },
      hybrid: { precision: 0, recall: 0, f1: 0 }
    };

    let evaluatedUsers = 0;

    // Evaluate for each user
    for (const user of users) {
      const profile = await Profile.findOne({ user: user._id });
      if (!profile) continue;

      const userInteractions = interactions.filter(i => i.userId.toString() === user._id.toString());
      // Skip users with too few interactions
      const minInteractions = parseInt(process.env.MIN_INTERACTIONS_FOR_EVALUATION) || 5;
      if (userInteractions.length < minInteractions) continue;

      // Get relevant items for this user
      const relevantItems = await getRelevantItems(user._id);
      if (relevantItems.length === 0) continue;

      // Get recommendations from each engine
      const recLimit = parseInt(process.env.RECOMMENDATIONS_LIMIT_FOR_EVALUATION) || 10;

      const contentRecs = contentEngine.recommend(profile, products, userInteractions, recLimit);
      const contentRecIds = contentRecs.map(rec => rec.product.id);

      const collaborativeRecs = collaborativeEngine.recommend(user._id.toString(), products, recLimit);
      const collaborativeRecIds = collaborativeRecs.map(rec => rec.product.id);

      const hybridRecs = await hybridEngine.recommend(
        user._id.toString(),
        profile,
        products,
        userInteractions,
        { limit: recLimit }
      );
      const hybridRecIds = hybridRecs.map(rec => rec.product.id);

      // Calculate metrics
      const contentPrecision = calculatePrecision(contentRecIds, relevantItems);
      const contentRecall = calculateRecall(contentRecIds, relevantItems);
      const contentF1 = calculateF1Score(contentPrecision, contentRecall);

      const collaborativePrecision = calculatePrecision(collaborativeRecIds, relevantItems);
      const collaborativeRecall = calculateRecall(collaborativeRecIds, relevantItems);
      const collaborativeF1 = calculateF1Score(collaborativePrecision, collaborativeRecall);

      const hybridPrecision = calculatePrecision(hybridRecIds, relevantItems);
      const hybridRecall = calculateRecall(hybridRecIds, relevantItems);
      const hybridF1 = calculateF1Score(hybridPrecision, hybridRecall);

      // Accumulate metrics
      metrics.content.precision += contentPrecision;
      metrics.content.recall += contentRecall;
      metrics.content.f1 += contentF1;

      metrics.collaborative.precision += collaborativePrecision;
      metrics.collaborative.recall += collaborativeRecall;
      metrics.collaborative.f1 += collaborativeF1;

      metrics.hybrid.precision += hybridPrecision;
      metrics.hybrid.recall += hybridRecall;
      metrics.hybrid.f1 += hybridF1;

      evaluatedUsers++;

      // Update hybrid engine weights based on performance
      hybridEngine.updateWeights({
        contentPrecision,
        collaborativePrecision
      });
    }

    // Calculate average metrics
    if (evaluatedUsers > 0) {
      metrics.content.precision /= evaluatedUsers;
      metrics.content.recall /= evaluatedUsers;
      metrics.content.f1 /= evaluatedUsers;

      metrics.collaborative.precision /= evaluatedUsers;
      metrics.collaborative.recall /= evaluatedUsers;
      metrics.collaborative.f1 /= evaluatedUsers;

      metrics.hybrid.precision /= evaluatedUsers;
      metrics.hybrid.recall /= evaluatedUsers;
      metrics.hybrid.f1 /= evaluatedUsers;
    }

    // Print results
    logger.info('=== Recommendation Engine Evaluation Results ===');
    logger.info(`Evaluated ${evaluatedUsers} users`);
    logger.info('\nContent-Based Engine:');
    logger.info(`Precision: ${(metrics.content.precision * 100).toFixed(2)}%`);
    logger.info(`Recall: ${(metrics.content.recall * 100).toFixed(2)}%`);
    logger.info(`F1 Score: ${(metrics.content.f1 * 100).toFixed(2)}%`);

    logger.info('\nCollaborative Filtering Engine:');
    logger.info(`Precision: ${(metrics.collaborative.precision * 100).toFixed(2)}%`);
    logger.info(`Recall: ${(metrics.collaborative.recall * 100).toFixed(2)}%`);
    logger.info(`F1 Score: ${(metrics.collaborative.f1 * 100).toFixed(2)}%`);

    logger.info('\nHybrid Recommendation Engine:');
    logger.info(`Precision: ${(metrics.hybrid.precision * 100).toFixed(2)}%`);
    logger.info(`Recall: ${(metrics.hybrid.recall * 100).toFixed(2)}%`);
    logger.info(`F1 Score: ${(metrics.hybrid.f1 * 100).toFixed(2)}%`);

    logger.info('\nFinal Hybrid Engine Weights:');
    logger.info(`Content Weight: ${hybridEngine.weights.content.toFixed(2)}`);
    logger.info(`Collaborative Weight: ${hybridEngine.weights.collaborative.toFixed(2)}`);

    return metrics;
  } catch (error) {
    logger.error(`Evaluation error: ${error.message}`);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
  }
}

// Run the evaluation
evaluateRecommendationEngines()
  .then(() => logger.info('Evaluation complete'))
  .catch(err => logger.error(`Evaluation failed: ${err.message}`));
