const MLUtils = require('./utils');
const mongoose = require('mongoose');
const Interaction = require('./Interaction');
const Product = require('../models/Product');
const User = require('../models/User');
const Profile = require('../models/Profile');

/**
 * Collaborative Filtering Engine
 * Uses user-item interactions to find similar users and recommend products
 */
class CollaborativeEngine {
  constructor() {
    this.utils = new MLUtils();
  }

  /**
   * Get recommendations based on similar users' preferences
   * @param {string} userId - User ID to get recommendations for
   * @param {number} limit - Maximum number of recommendations to return
   * @returns {Promise<Array>} - Array of recommended products with scores
   */
  async getRecommendations(userId, limit = 5) {
    try {
      // Get the user's profile
      const userProfile = await Profile.findOne({ user: userId });
      if (!userProfile) {
        console.log('No user profile found for collaborative filtering');
        return [];
      }

      // Get all interactions
      const interactions = await Interaction.find({}).populate('user product');
      if (!interactions || interactions.length === 0) {
        console.log('No interactions found for collaborative filtering');
        return [];
      }

      // Get all users with their interactions
      const users = await User.find({});
      if (!users || users.length === 0) {
        console.log('No users found for collaborative filtering');
        return [];
      }

      // Get user interactions
      const userInteractions = interactions.filter(
        interaction => interaction.user && interaction.user._id &&
        interaction.user._id.toString() === userId.toString()
      );

      // Get products the user has already interacted with
      const userProductIds = userInteractions.map(
        interaction => interaction.product && interaction.product._id &&
        interaction.product._id.toString()
      ).filter(id => id); // Filter out any undefined values

      const userSimilarities = [];
      for (const otherUser of users) {
        if (otherUser._id.toString() === userId.toString()) continue;

        const otherUserInteractions = interactions.filter(
          interaction => interaction.user && interaction.user._id &&
          interaction.user._id.toString() === otherUser._id.toString()
        );

        const similarity = this.utils.calculateUserSimilarity(userProfile, otherUser, userInteractions, otherUserInteractions);
        userSimilarities.push({
          user: otherUser,
          similarity
        });
      }

      userSimilarities.sort((a, b) => b.similarity - a.similarity);

      const topSimilarUsers = userSimilarities.slice(0, 3);

      const candidateProducts = [];
      for (const { user: similarUser, similarity } of topSimilarUsers) {
        if (similarity <= 0) continue; // Skip users with no similarity

        const similarUserInteractions = interactions.filter(
          interaction => interaction.user && interaction.user._id &&
          interaction.user._id.toString() === similarUser._id.toString() &&
          interaction.rating > 3 // Only consider positive interactions
        );

        for (const interaction of similarUserInteractions) {
          if (!interaction.product) continue;

          const productId = interaction.product._id.toString();

          if (userProductIds.includes(productId)) continue;

          // Check if product is already in candidates
          const existingProduct = candidateProducts.find(p => p.product._id.toString() === productId);

          if (existingProduct) {
            // Update score if product already exists in candidates
            existingProduct.score += similarity * interaction.rating;
          } else {
            // Add new product to candidates
            candidateProducts.push({
              product: interaction.product,
              score: similarity * interaction.rating
            });
          }
        }
      }

      candidateProducts.sort((a, b) => b.score - a.score);


      return candidateProducts.slice(0, limit).map(item => ({
        product: item.product,
        score: item.score,
        source: 'collaborative'
      }));
    } catch (error) {
      console.error('Error in collaborative filtering:', error);
      return [];
    }
  }
}

module.exports = CollaborativeEngine;
