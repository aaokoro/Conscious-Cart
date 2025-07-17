const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  price: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  skinTypes: [{
    type: String,
    enum: ['oily', 'dry', 'combination', 'normal', 'sensitive']
  }],
  skinConcerns: [{
    type: String,
    enum: ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness']
  }],
  ingredient_list: [{
    type: String
  }],
  isSustainable: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);
