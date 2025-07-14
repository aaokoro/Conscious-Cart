const MLUtils = require('./utils');
const ML_CONFIG = require('./config');

class ContentBasedEngine {
  constructor() {
    this.productVectors = new Map();
    this.config = ML_CONFIG.CONTENT_BASED;
    this.ingredientWeights = this.config.INGREDIENT_WEIGHTS;
  }

  createProductVector(product) {
    const features = [];

    this.config.SKIN_TYPES.forEach(type => {
      features.push(product.skinTypes?.includes(type) ? 1 : 0);
    });

    this.config.SKIN_CONCERNS.forEach(concern => {
      features.push(product.skinConcerns?.includes(concern) ? 1 : 0);
    });

    const priceTier = product.price < this.config.PRICE_TIERS.LOW ? 0.2 :
                     product.price < this.config.PRICE_TIERS.MEDIUM ? 0.5 :
                     product.price < this.config.PRICE_TIERS.HIGH ? 0.7 : 1.0;
    features.push(priceTier);

    features.push(product.rating / 5.0);

    // Sustainability
    features.push(product.isSustainable ? 1 : 0);

    Object.keys(this.ingredientWeights).forEach(ingredient => {
      const hasIngredient = product.ingredient_list?.some(ing =>
        ing.toLowerCase().includes(ingredient.toLowerCase())
      );
      features.push(hasIngredient ? this.ingredientWeights[ingredient] : 0);
    });

    return features;
  }

  createUserVector(userProfile, userHistory = []) {
    const features = [];

    // This is User skin type preferences
    this.config.SKIN_TYPES.forEach(type => {
      features.push(userProfile.skinType === type ? 1 : 0);
    });

    // this is User skin concerns
    this.config.SKIN_CONCERNS.forEach(concern => {
      features.push(userProfile.skinConcerns?.includes(concern) ? 1 : 0);
    });

    const avgPrice = userHistory.length > 0
      ? userHistory.reduce((sum, item) => sum + item.price, 0) / userHistory.length
      : this.config.DEFAULTS.AVERAGE_PRICE;
    const priceTier = avgPrice < this.config.PRICE_TIERS.LOW ? 0.2 :
                     avgPrice < this.config.PRICE_TIERS.MEDIUM ? 0.5 :
                     avgPrice < this.config.PRICE_TIERS.HIGH ? 0.7 : 1.0;
    features.push(priceTier);

    // Average rating preference
    const avgRating = userHistory.length > 0
      ? userHistory.reduce((sum, item) => sum + item.rating, 0) / userHistory.length
      : this.config.DEFAULTS.AVERAGE_RATING;
    features.push(avgRating / 5.0);

    features.push(userProfile.sustainabilityPreference ? 1 : 0);

    Object.keys(this.ingredientWeights).forEach(ingredient => {
      const preference = userHistory.filter(item =>
        item.ingredient_list?.some(ing => ing.toLowerCase().includes(ingredient.toLowerCase()))
      ).length / Math.max(userHistory.length, 1);
      features.push(preference);
    });

    return features;
  }

  // Generating content-based recommendations
  recommend(userProfile, products, userHistory = [], limit = this.config.DEFAULTS.RECOMMENDATION_LIMIT) {
    const userVector = this.createUserVector(userProfile, userHistory);

    const recommendations = products.map(product => {
      const productVector = this.createProductVector(product);
      const similarity = MLUtils.cosineSimilarity(userVector, productVector);

      return {
        product,
        score: similarity,
        explanation: this.generateExplanation(product, userProfile)
      };
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  generateExplanation(product, userProfile) {
    const reasons = [];

    if (product.skinTypes?.includes(userProfile.skinType)) {
      reasons.push(`Perfect for ${userProfile.skinType} skin`);
    }

    const matchingConcerns = product.skinConcerns?.filter(concern =>
      userProfile.skinConcerns?.includes(concern)
    );
    if (matchingConcerns?.length > 0) {
      reasons.push(`Addresses your ${matchingConcerns.join(', ')} concerns`);
    }

    if (product.isSustainable && userProfile.sustainabilityPreference) {
      reasons.push('Matches your sustainability preference');
    }

    return reasons.join(' • ');
  }
}

module.exports = ContentBasedEngine;
