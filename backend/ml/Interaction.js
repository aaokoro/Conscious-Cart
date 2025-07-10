const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  interactionType: {
    type: String,
    enum: ['view', 'click', 'purchase', 'favorite', 'review', 'search'],
    required: true
  },
  rating: { type: Number, min: 1, max: 5 },
  timeSpent: { type: Number, default: 0 }, 
  metadata: {
    searchQuery: String,
    referrer: String,
    deviceType: String,
    timestamp: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now }
});

InteractionSchema.index({ userId: 1, productId: 1, interactionType: 1 });
InteractionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Interaction', InteractionSchema);
