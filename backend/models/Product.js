const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  ingredients: [{
    type: String,
    required: true
  }],
  skinTypes: [{
    type: String,
    enum: ['oily', 'dry', 'combination', 'normal', 'sensitive'],
    required: true
  }],
  skinConcerns: [{
    type: String,
    enum: ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness'],
    required: true
  }],
  isSustainable: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0
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

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search functionality
productSchema.index({ name: 'text', brand: 'text', ingredients: 'text' });

module.exports = mongoose.model('Product', productSchema);
