const mongoose = require('mongoose');

// Helper function to get model if it exists or create it
const getModel = (name, schema) => {
  return mongoose.models[name] || require(`./${name}`);
};

// Get models, reusing existing ones if they exist
const User = getModel('User');
const Profile = getModel('Profile');
const Product = getModel('Product');

let Interaction;
try {
  // Only require Interaction if it doesn't already exist
  Interaction = mongoose.models['Interaction'] || require('../ml/Interaction');
} catch (err) {
  // If Interaction model can't be loaded, create a placeholder
  Interaction = {};
}

module.exports = {
  User,
  Profile,
  Product,
  Interaction
};
