const mongoose = require('mongoose');

const skinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
const skinConcerns = ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness'];
const preferences = ['fragrance-free', 'cruelty-free', 'natural', 'clinical'];

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skinType: { type: String, enum: skinTypes },
  skinConcerns: [{ type: String, enum: skinConcerns }],
  preferences: [{ type: String, enum: preferences }],
  sustainabilityPreference: { type: Boolean, default: false },
  photoUrls: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: String,
  ingredients: [String],
  skinTypes: [{ type: String, enum: skinTypes }],
  skinConcerns: [{ type: String, enum: skinConcerns }],
  tags: [String],
  isSustainable: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  externalId: String,
  externalSource: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Profile = mongoose.model('Profile', ProfileSchema);
const Product = mongoose.model('Product', ProductSchema);

module.exports = {
  User,
  Profile,
  Product
};
