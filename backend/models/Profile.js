const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  skinType: {
    type: String,
    enum: ['oily', 'dry', 'combination', 'normal', 'sensitive'],
    required: true
  },
  skinConcerns: [{
    type: String,
    enum: ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness']
  }],
  sustainabilityPreference: {
    type: Boolean,
    default: false
  },
  pricePreference: {
    type: String,
    enum: ['budget', 'mid-range', 'luxury'],
    default: 'mid-range'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', ProfileSchema);
