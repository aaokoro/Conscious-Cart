const mongoose = require('mongoose');

const InteractionConfig = {
  userRef: 'User',
  productRef: 'Product',
  interactionTypes: ['view', 'click', 'purchase', 'favorite', 'review', 'search'],
  ratingRange: { min: 1, max: 5 }
};
const InteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: InteractionConfig.userRef,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: InteractionConfig.productRef,
    required: true
  },
  interactionType: {
    type: String,
    enum: InteractionConfig.interactionTypes,
    required: true
  },
  rating: {
    type: Number,
    min: InteractionConfig.ratingRange.min,
    max: InteractionConfig.ratingRange.max
  },
  timeSpent: { type: Number, default: 0 },
  metadata: {
    searchQuery: String,
    referrer: String,
    deviceType: String,
    timestamp: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now }
});

const createIndexes = (schema) => {
  schema.index({ userId: 1, productId: 1, interactionType: 1 });
  schema.index({ userId: 1, createdAt: -1 });
  schema.index({ productId: 1, createdAt: -1 });
};

createIndexes(InteractionSchema);

InteractionSchema.statics.createInteraction = function(interactionData) {
  const { user, product, type, ...otherData } = interactionData;

  return new this({
    userId: user,
    productId: product,
    interactionType: type,
    ...otherData
  });
};

InteractionSchema.statics.getValidInteractionTypes = function() {
  return InteractionConfig.interactionTypes;
};

InteractionSchema.statics.updateConfig = function(newConfig) {
  Object.assign(InteractionConfig, newConfig);
};

// Instance methods for flexible data access
InteractionSchema.methods.getUser = function() {
  return this.userId;
};

InteractionSchema.methods.getProduct = function() {
  return this.productId;
};

InteractionSchema.methods.getType = function() {
  return this.interactionType;
};

module.exports = mongoose.model('Interaction', InteractionSchema);
module.exports.InteractionConfig = InteractionConfig;
