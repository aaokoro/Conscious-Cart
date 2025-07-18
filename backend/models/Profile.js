const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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
  preferences: [{
    type: String,
    enum: ['fragrance-free', 'paraben-free', 'sulfate-free', 'cruelty-free', 'vegan', 'organic']
  }],
  sustainabilityPreference: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

profileSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
