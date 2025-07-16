const MLUtils = require('./utils');

class ContentBasedEngine {
  constructor() {
    this.productVectors = new Map();
    this.ingredientWeights = {
      'hyaluronic acid': 0.9, 'retinol': 0.8, 'niacinamide': 0.7,
      'salicylic acid': 0.8, 'glycolic acid': 0.7, 'ceramides': 0.6
    };
  }

  createProductVector(product) {
    const features = [];

    const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
    skinTypes.forEach(type => {
      features.push(product.skinTypes?.includes(type) ? 1 : 0);
    });

    const concerns = ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness'];
    concerns.forEach(concern => {
      features.push(product.skinConcerns?.includes(concern) ? 1 : 0);
    });

    const priceTier = product.price < 20 ? 0.2 : product.price < 40 ? 0.5 : product.price < 60 ? 0.7 : 1.0;
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
    const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
    skinTypes.forEach(type => {
      features.push(userProfile.skinType === type ? 1 : 0);
    });

    // this is User skin concerns
    const concerns = ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness'];
    concerns.forEach(concern => {
      features.push(userProfile.skinConcerns?.includes(concern) ? 1 : 0);
    });

    const avgPrice = userHistory.length > 0
      ? userHistory.reduce((sum, item) => sum + item.price, 0) / userHistory.length
      : 30; // default
    const priceTier = avgPrice < 20 ? 0.2 : avgPrice < 40 ? 0.5 : avgPrice < 60 ? 0.7 : 1.0;
    features.push(priceTier);

    // Average rating preference
    const avgRating = userHistory.length > 0
      ? userHistory.reduce((sum, item) => sum + item.rating, 0) / userHistory.length
      : 4.0; // Default
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
  recommend(userProfile, products, userHistory = [], limit = 10) {
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
