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
    try {
      if (!product) {
        return Array(14).fill(0); // Return zero vector with expected length
      }

      const features = [];

      // Handle skin types
      // Ensure skinTypes is always an array and normalize it
      let productSkinTypes = [];

      if (Array.isArray(product.skinTypes)) {
        productSkinTypes = product.skinTypes;
      } else if (typeof product.skinTypes === 'string') {
        productSkinTypes = [product.skinTypes];
      } else if (typeof product.skinType === 'string') {
        // Some products might use skinType (singular) instead of skinTypes
        productSkinTypes = [product.skinType];
      }

      // Normalize all skin types to lowercase
      const normalizedSkinTypes = productSkinTypes.map(type =>
        typeof type === 'string' ? type.toLowerCase() : ''
      ).filter(type => type !== '');

      const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
      skinTypes.forEach(type => {
        // Check if any of the product's skin types includes this type (case insensitive)
        const hasType = normalizedSkinTypes.includes(type.toLowerCase());
        features.push(hasType ? 1 : 0);
      });

      // Handle skin concerns
      // Ensure skinConcerns is always an array and normalize it
      let productConcerns = [];

      if (Array.isArray(product.skinConcerns)) {
        productConcerns = product.skinConcerns;
      } else if (typeof product.skinConcerns === 'string') {
        productConcerns = [product.skinConcerns];
      } else if (Array.isArray(product.concerns)) {
        // Some products might use concerns instead of skinConcerns
        productConcerns = product.concerns;
      } else if (typeof product.concerns === 'string') {
        productConcerns = [product.concerns];
      }

      // Normalize all concerns to lowercase
      const normalizedConcerns = productConcerns.map(concern =>
        typeof concern === 'string' ? concern.toLowerCase() : ''
      ).filter(concern => concern !== '');

      const concerns = ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness', 'oiliness'];
      concerns.forEach(concern => {
        // Check if any of the product's concerns includes this concern (case insensitive)
        const hasConcern = normalizedConcerns.some(c =>
          c.includes(concern.toLowerCase())
        );
        features.push(hasConcern ? 1 : 0);
      });

      // Handle price
      const price = typeof product.price === 'number' ? product.price :
                   (typeof product.price === 'string' ? parseFloat(product.price) || 30 : 30);
      const priceTier = price < 20 ? 0.2 : price < 40 ? 0.5 : price < 60 ? 0.7 : 1.0;
      features.push(priceTier);

      // Handle rating
      const rating = typeof product.rating === 'number' ? product.rating :
                    (typeof product.rating === 'string' ? parseFloat(product.rating) || 0 : 0);
      features.push(rating / 5.0);

      // Handle sustainability
      features.push(product.isSustainable === true ? 1 : 0);

      // Handle ingredients
      // Try multiple possible ingredient field names
      let ingredientList = [];
      if (Array.isArray(product.ingredients)) {
        ingredientList = product.ingredients;
      } else if (Array.isArray(product.ingredient_list)) {
        ingredientList = product.ingredient_list;
      } else if (typeof product.ingredients === 'string') {
        // Handle case where ingredients might be a comma-separated string
        ingredientList = product.ingredients.split(',').map(i => i.trim());
      } else if (typeof product.ingredient_list === 'string') {
        ingredientList = product.ingredient_list.split(',').map(i => i.trim());
      }

      Object.keys(this.ingredientWeights).forEach(ingredient => {
        const hasIngredient = ingredientList.some(ing =>
          typeof ing === 'string' && ing.toLowerCase().includes(ingredient.toLowerCase())
        );
        features.push(hasIngredient ? this.ingredientWeights[ingredient] : 0);
      });

      return features;
    } catch (error) {
      return Array(14).fill(0); // Return zero vector with expected length
    }
  }

  prioritizeSkinConcerns(userProfile) {
    try {
      // Ensure skinConcerns is always an array
      const userConcerns = Array.isArray(userProfile.skinConcerns) ? userProfile.skinConcerns :
                          (typeof userProfile.skinConcerns === 'string' ? [userProfile.skinConcerns] : []);

      // Convert all concerns to lowercase for case-insensitive comparison
      const normalizedConcerns = userConcerns.map(concern =>
        typeof concern === 'string' ? concern.toLowerCase() : ''
      ).filter(concern => concern !== '');

      // Get primary concerns (first 1-2 concerns have higher weight)
      const primaryConcerns = normalizedConcerns.slice(0, 2);
      const secondaryConcerns = normalizedConcerns.slice(2);

      const concerns = ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness', 'oiliness'];
      return concerns.map(concern => {
        // Case-insensitive comparison
        if (primaryConcerns.includes(concern.toLowerCase())) return 1.5; // Higher weight for primary concerns
        if (secondaryConcerns.includes(concern.toLowerCase())) return 1.0; // Normal weight for secondary concerns
        return 0; // No concern
      });
    } catch (error) {
      return Array(7).fill(0); // Return zero vector with expected length for concerns
    }
  }

  createUserVector(userProfile, userHistory = []) {
    try {
      if (!userProfile) {
        return Array(14).fill(0); // Return zero vector with expected length
      }

      const features = [];

      // Handle skin type
      const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
      skinTypes.forEach(type => {
        // Case-insensitive comparison
        const isMatch = typeof userProfile.skinType === 'string' &&
                       userProfile.skinType.toLowerCase() === type.toLowerCase();
        features.push(isMatch ? 1 : 0);
      });

      // Handle skin concerns
      // Ensure skinConcerns is always an array
      const userConcerns = Array.isArray(userProfile.skinConcerns) ? userProfile.skinConcerns :
                          (typeof userProfile.skinConcerns === 'string' ? [userProfile.skinConcerns] : []);

      const concernWeights = this.prioritizeSkinConcerns({
        ...userProfile,
        skinConcerns: userConcerns
      });
      features.push(...concernWeights);

      const avgPrice = userHistory.length > 0
        ? userHistory.reduce((sum, item) => sum + (typeof item.price === 'number' ? item.price : 0), 0) / userHistory.length
        : 30; // default
      const priceTier = avgPrice < 20 ? 0.2 : avgPrice < 40 ? 0.5 : avgPrice < 60 ? 0.7 : 1.0;
      features.push(priceTier);

      const avgRating = userHistory.length > 0
        ? userHistory.reduce((sum, item) => sum + (typeof item.rating === 'number' ? item.rating : 0), 0) / userHistory.length
        : 4.0; // Default
      features.push(avgRating / 5.0);

      features.push(userProfile.sustainabilityPreference === true ? 1 : 0);

      // Handle ingredient preferences
      Object.keys(this.ingredientWeights).forEach(ingredient => {
        // Calculate preference based on user history
        const preference = userHistory.filter(item => {
          const ingredientList = Array.isArray(item.ingredients) ? item.ingredients :
                                (Array.isArray(item.ingredient_list) ? item.ingredient_list : []);

          return ingredientList.some(ing =>
            typeof ing === 'string' && ing.toLowerCase().includes(ingredient.toLowerCase())
          );
        }).length / Math.max(userHistory.length, 1);

        features.push(preference);
      });

      return features;
    } catch (error) {
      return Array(14).fill(0); // Return zero vector with expected length
    }
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
