const ContentBasedEngine = require('./contentBasedEngine');
const CollaborativeEngine = require('./collaborativeEngine');

class HybridRecommendationEngine {
  constructor(config = {}) {
    this.contentEngine = new ContentBasedEngine();
    this.collaborativeEngine = new CollaborativeEngine();

    this.config = {
      weights: {
        content: config.weights?.content ?? 0.6,
        collaborative: config.weights?.collaborative ?? 0.4,
        popularity: config.weights?.popularity ?? 0.1,
        diversity: config.weights?.diversity ?? 0.1
      },
      limits: {
        default: config.limits?.default ?? 10,
        multiplier: config.limits?.multiplier ?? 2
      },
      diversity: {
        sameBrandPenalty: config.diversity?.sameBrandPenalty ?? 0.8,
        similarConcernsPenalty: config.diversity?.similarConcernsPenalty ?? 0.9,
        highOverlapThreshold: config.diversity?.highOverlapThreshold ?? 0.8
      },
      weightAdjustment: {
        maxWeight: config.weightAdjustment?.maxWeight ?? 0.8,
        minWeight: config.weightAdjustment?.minWeight ?? 0.2,
        step: config.weightAdjustment?.step ?? 0.1
      }
    };

    this.weights = this.config.weights;
  }

  async recommend(userId, userProfile, products, interactions = [], options = {}) {
    const limit = options.limit || this.config.limits.default;
    const includeExplanations = options.includeExplanations !== false;

    const userHistory = this.getUserHistory(userId, interactions, products);
    const contentRecs = this.contentEngine.recommend(userProfile, products, userHistory, limit * this.config.limits.multiplier);

    this.collaborativeEngine.buildUserItemMatrix(interactions);
    const collaborativeRecs = this.collaborativeEngine.recommend(userId, products, limit * this.config.limits.multiplier);

    const combinedRecs = this.combineRecommendations(contentRecs, collaborativeRecs, products);

    const diverseRecs = this.applyDiversityFilter(combinedRecs, userHistory);

    const finalRecs = this.addPopularityBoost(diverseRecs, products, interactions);

    return finalRecs
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit)
      .map(rec => ({
        product: rec.product,
        score: rec.finalScore,
        confidence: rec.confidence,
        explanation: includeExplanations ? rec.explanation : undefined,
        reasons: includeExplanations ? rec.reasons : undefined
      }));
  }

  combineRecommendations(contentRecs, collaborativeRecs, products) {
    const combined = new Map();

    contentRecs.forEach(rec => {
      combined.set(rec.product.id, {
        product: rec.product,
        contentScore: rec.score,
        collaborativeScore: 0,
        explanation: rec.explanation,
        reasons: ['Content-based matching']
      });
    });

    collaborativeRecs.forEach(rec => {
      if (combined.has(rec.product.id)) {
        combined.get(rec.product.id).collaborativeScore = rec.score;
        combined.get(rec.product.id).reasons.push('Similar user preferences');
      } else {
        combined.set(rec.product.id, {
          product: rec.product,
          contentScore: 0,
          collaborativeScore: rec.score,
          explanation: rec.explanation,
          reasons: ['Similar user preferences']
        });
      }
    });

    return Array.from(combined.values()).map(rec => {
      const combinedScore = (
        rec.contentScore * this.weights.content +
        rec.collaborativeScore * this.weights.collaborative
      );

      return {
        ...rec,
        combinedScore,
        confidence: this.calculateConfidence(rec.contentScore, rec.collaborativeScore)
      };
    });
  }

  calculateConfidence(contentScore, collaborativeScore) {
    const agreement = Math.min(contentScore, collaborativeScore);
    const coverage = (contentScore > 0 ? 0.5 : 0) + (collaborativeScore > 0 ? 0.5 : 0);
    return (agreement + coverage) / 2;
  }

  applyDiversityFilter(recommendations, userHistory) {
    const historyBrands = new Set(userHistory.map(product => product.brand));
    const historyConcerns = new Set(userHistory.flatMap(product => product.skinConcerns || []));

    return recommendations.map(rec => {
      let diversityScore = 1.0;

      if (historyBrands.has(rec.product.brand)) {
        diversityScore *= this.config.diversity.sameBrandPenalty;
      }

      const productConcerns = new Set(rec.product.skinConcerns || []);
      const overlapRatio = [...productConcerns].filter(c => historyConcerns.has(c)).length /
                          Math.max(productConcerns.size, 1);
      if (overlapRatio > this.config.diversity.highOverlapThreshold) {
        diversityScore *= this.config.diversity.similarConcernsPenalty;
      }

      return {
        ...rec,
        diversityScore,
        finalScore: rec.combinedScore * diversityScore
      };
    });
  }

  addPopularityBoost(recommendations, products, interactions) {
    const productPopularity = new Map();
    interactions.forEach(interaction => {
      const current = productPopularity.get(interaction.productId) || 0;
      productPopularity.set(interaction.productId, current + 1);
    });

    const maxPopularity = Math.max(...productPopularity.values(), 1);

    return recommendations.map(rec => {
      const popularity = (productPopularity.get(rec.product.id) || 0) / maxPopularity;
      const popularityBoost = popularity * this.weights.popularity;

      return {
        ...rec,
        popularityScore: popularity,
        finalScore: rec.finalScore + popularityBoost
      };
    });
  }

  getUserHistory(userId, interactions, products) {
    return interactions
      .filter(interaction => interaction.userId === userId)
      .map(interaction => products.find(product => product.id === interaction.productId))
      .filter(Boolean);
  }

  updateWeights(performanceMetrics) {
    const { maxWeight, minWeight, step } = this.config.weightAdjustment;

    if (performanceMetrics.contentPrecision > performanceMetrics.collaborativePrecision) {
      this.weights.content = Math.min(maxWeight, this.weights.content + step);
      this.weights.collaborative = Math.max(minWeight, this.weights.collaborative - step);
    } else {
      this.weights.collaborative = Math.min(maxWeight, this.weights.collaborative + step);
      this.weights.content = Math.max(minWeight, this.weights.content - step);
    }
  }
}

module.exports = HybridRecommendationEngine;
