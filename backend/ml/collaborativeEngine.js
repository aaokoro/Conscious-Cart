const MLUtils = require('./utils');
const ML_CONFIG = require('./config');


class CollaborativeEngine {
  constructor() {
    this.userItemMatrix = new Map();
    this.userSimilarities = new Map();
    this.config = ML_CONFIG.COLLABORATIVE;

  }

  buildUserItemMatrix(interactions) {
    const matrix = new Map();

    interactions.forEach(interaction => {
      if (!matrix.has(interaction.userId)) {
        matrix.set(interaction.userId, new Map());
      }

      const rating = interaction.rating || this.calculateImplicitRating(interaction);
      matrix.get(interaction.userId).set(interaction.productId, rating);
    });

    this.userItemMatrix = matrix;
    return matrix;
  }

  calculateImplicitRating(interaction) {
    let rating = 0;
    if (interaction.viewed) rating += this.config.IMPLICIT_RATING.VIEW_WEIGHT;
    if (interaction.timeSpent > this.config.IMPLICIT_RATING.TIME_THRESHOLD) rating += this.config.IMPLICIT_RATING.TIME_WEIGHT;
    if (interaction.purchased) rating += this.config.IMPLICIT_RATING.PURCHASE_WEIGHT;
    if (interaction.favorited) rating += this.config.IMPLICIT_RATING.FAVORITE_WEIGHT;
    if (interaction.reviewed) rating += this.config.IMPLICIT_RATING.REVIEW_WEIGHT;
    return Math.min(rating, this.config.IMPLICIT_RATING.MAX_RATING);
  }

  findSimilarUsers(targetUserId, threshold = this.config.SIMILARITY_THRESHOLD, limit = this.config.SIMILAR_USERS_LIMIT) {

    if (interaction.viewed) rating += 1;
    if (interaction.timeSpent > 30) rating += 1;
    if (interaction.purchased) rating += 3;
    if (interaction.favorited) rating += 2;
    if (interaction.reviewed) rating += 1;
    return Math.min(rating, 5);
  }

  findSimilarUsers(targetUserId, threshold = 0.3, limit = 50) {
    const targetUserRatings = this.userItemMatrix.get(targetUserId);
    if (!targetUserRatings) return [];

    const similarities = [];

    for (const [userId, userRatings] of this.userItemMatrix) {
      if (userId === targetUserId) continue;

      const commonItems = [];
      const targetRatingsArray = [];
      const userRatingsArray = [];

      for (const [itemId, rating] of targetUserRatings) {
        if (userRatings.has(itemId)) {
          commonItems.push(itemId);
          targetRatingsArray.push(rating);
          userRatingsArray.push(userRatings.get(itemId));
        }
      }

      if (commonItems.length >= this.config.MIN_COMMON_ITEMS) {
      if (commonItems.length >= 2) {
        const correlation = MLUtils.pearsonCorrelation(targetRatingsArray, userRatingsArray);
        if (correlation > threshold) {
          similarities.push({ userId, similarity: correlation, commonItems: commonItems.length });
        }
      }
    }

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  recommend(targetUserId, products, limit = this.config.DEFAULT_LIMIT) {
  recommend(targetUserId, products, limit = 10) {
    const similarUsers = this.findSimilarUsers(targetUserId);
    if (similarUsers.length === 0) return [];

    const targetUserRatings = this.userItemMatrix.get(targetUserId) || new Map();
    const recommendations = new Map();

    for (const { userId, similarity } of similarUsers) {

      const userRatings = this.userItemMatrix.get(userId);

      for (const [productId, rating] of userRatings) {
        if (targetUserRatings.has(productId)) continue;

        if (!recommendations.has(productId)) {
          recommendations.set(productId, { weightedSum: 0, similaritySum: 0 });
        }

        const rec = recommendations.get(productId);
        rec.weightedSum += rating * similarity;
        rec.similaritySum += Math.abs(similarity);
      }
    }

    const finalRecommendations = [];

    for (const [productId, { weightedSum, similaritySum }] of recommendations) {
      if (similaritySum > 0) {
        const predictedRating = weightedSum / similaritySum;
        const product = products.find(p => p.id.toString() === productId.toString());

        if (product) {
          finalRecommendations.push({
            product,
            score: predictedRating,
            explanation: `Recommended by ${similarUsers.length} similar users`
          });
        }
      }
    }

    return finalRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = CollaborativeEngine;
