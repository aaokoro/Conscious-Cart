const mongoose = require('mongoose');
const { User, Profile, Product } = require('./models');
const Interaction = require('./ml/Interaction');
require('dotenv').config();

// Sample data for seeding
const users = [
  {
    firebaseUid: 'test-uid-1',
    email: 'user1@example.com',
    displayName: 'Test User 1'
  },
  {
    firebaseUid: 'test-uid-2',
    email: 'user2@example.com',
    displayName: 'Test User 2'
  }
];

const profiles = [
  {
    skinType: 'dry',
    skinConcerns: ['aging', 'dryness'],
    sustainabilityPreference: true,
    pricePreference: 'mid-range'
  },
  {
    skinType: 'oily',
    skinConcerns: ['acne', 'sensitivity'],
    sustainabilityPreference: false,
    pricePreference: 'budget'
  }
];

// Add a mock user with uid 'mock-uid'
users.push({
  firebaseUid: 'mock-uid',
  email: 'test@test.com',
  displayName: 'Test User'
});

// Add a profile for the mock user
profiles.push({
  skinType: 'normal',
  skinConcerns: ['dryness', 'sensitivity'],
  sustainabilityPreference: true,
  pricePreference: 'mid-range'
});

const products = [
  {
    name: 'Hydrating Serum',
    brand: 'SkinCo',
    description: 'A deeply hydrating serum for dry skin',
    price: 35,
    rating: 4.5,
    skinTypes: ['dry', 'normal'],
    skinConcerns: ['dryness', 'aging'],
    ingredient_list: ['hyaluronic acid', 'glycerin', 'aloe vera'],
    isSustainable: true
  },
  {
    name: 'Retinol Night Cream',
    brand: 'AgeLess',
    description: 'Anti-aging night cream with retinol',
    price: 45,
    rating: 4.2,
    skinTypes: ['normal', 'dry'],
    skinConcerns: ['aging', 'hyperpigmentation'],
    ingredient_list: ['retinol', 'peptides', 'shea butter'],
    isSustainable: false
  },
  {
    name: 'Oil-Free Moisturizer',
    brand: 'ClearSkin',
    description: 'Lightweight moisturizer for oily skin',
    price: 28,
    rating: 4.0,
    skinTypes: ['oily', 'combination'],
    skinConcerns: ['acne', 'redness'],
    ingredient_list: ['niacinamide', 'zinc', 'tea tree oil'],
    isSustainable: true
  },
  {
    name: 'Vitamin C Brightening Serum',
    brand: 'GlowUp',
    description: 'Brightening serum with vitamin C',
    price: 52,
    rating: 4.7,
    skinTypes: ['normal', 'sensitive'],
    skinConcerns: ['hyperpigmentation', 'aging'],
    ingredient_list: ['vitamin c', 'ferulic acid', 'vitamin e'],
    isSustainable: true
  },
  {
    name: 'Gentle Cleansing Foam',
    brand: 'SkinCo',
    description: 'Gentle cleanser for sensitive skin',
    price: 22,
    rating: 4.3,
    skinTypes: ['sensitive', 'dry'],
    skinConcerns: ['sensitivity', 'dryness'],
    ingredient_list: ['glycerin', 'aloe vera', 'chamomile extract'],
    isSustainable: true
  }
];

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skinfluence', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false;
  }
}

async function seedDatabase() {
  console.log('Seeding database with sample data...');

  try {
    // Connect to the database
    const isConnected = await connectToDatabase();
    if (!isConnected) {
      console.error('Cannot proceed without database connection');
      return;
    }

    // Clear existing data
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Product.deleteMany({});
    await Interaction.deleteMany({});

    console.log('Cleared existing data');

    // Create users
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create profiles
    const profilePromises = createdUsers.map((user, index) => {
      const profile = new Profile({
        user: user._id,
        ...profiles[index]
      });
      return profile.save();
    });

    const createdProfiles = await Promise.all(profilePromises);
    console.log(`Created ${createdProfiles.length} profiles`);

    // Create products
    const createdProducts = await Product.insertMany(products);
    console.log(`Created ${createdProducts.length} products`);

    // Create interactions
    const interactions = [
      {
        userId: createdUsers[0]._id,
        productId: createdProducts[1]._id,
        interactionType: 'purchase',
        rating: 5,
        timeSpent: 120
      },
      {
        userId: createdUsers[0]._id,
        productId: createdProducts[4]._id,
        interactionType: 'purchase',
        rating: 4,
        timeSpent: 90
      },
      {
        userId: createdUsers[1]._id,
        productId: createdProducts[0]._id,
        interactionType: 'purchase',
        rating: 5,
        timeSpent: 100
      },
      {
        userId: createdUsers[1]._id,
        productId: createdProducts[2]._id,
        interactionType: 'purchase',
        rating: 4,
        timeSpent: 80
      }
    ];

    const createdInteractions = await Interaction.insertMany(interactions);
    console.log(`Created ${createdInteractions.length} interactions`);

    console.log('Database seeded successfully!');

    // Print out the created data for reference
    console.log('\nCreated Users:');
    createdUsers.forEach(user => {
      console.log(`- ${user.email} (${user._id})`);
    });

    console.log('\nCreated Products:');
    createdProducts.forEach(product => {
      console.log(`- ${product.name} by ${product.brand} (${product._id})`);
    });

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedDatabase();
