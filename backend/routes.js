const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Mock data for when MongoDB is not available
const mockProducts = [
  {
    _id: '1',
    name: "Gentle Cleanser",
    brand: "SkinCare Pro",
    price: 24.99,
    rating: 4.5,
    description: "A gentle, non-drying cleanser perfect for sensitive skin.",
    skinTypes: ["sensitive"],
    skinConcerns: ["sensitivity"],
    isSustainable: true
  },
  {
    _id: '2',
    name: "Hydrating Serum",
    brand: "GlowUp",
    price: 39.99,
    rating: 4.8,
    description: "Intensive hydrating serum with hyaluronic acid.",
    skinTypes: ["dry"],
    skinConcerns: ["dryness"],
    isSustainable: false
  },
  {
    _id: '3',
    name: "Oil Control Moisturizer",
    brand: "ClearSkin",
    price: 29.99,
    rating: 4.3,
    description: "Lightweight moisturizer that controls oil without drying.",
    skinTypes: ["oily"],
    skinConcerns: ["acne"],
    isSustainable: true
  }
];

// Check if MongoDB is connected
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Try to initialize Firebase Admin (optional)
let admin = null;
try {
  admin = require('firebase-admin');
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }
} catch (err) {
  console.log('Firebase Admin not configured - using simple auth');
}

// Import models only if MongoDB is available
let User, Profile, Product;
try {
  const models = require('./models');
  User = models.User;
  Profile = models.Profile;
  Product = models.Product;
} catch (err) {
  console.log('Models not available - using mock data');
}

const { auth } = require('./middleware');

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.post('/api/auth/register', [
  check('email').isEmail(),
  check('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return error(res, 'Invalid input', 400);

  try {
    const { email, password, name } = req.body;

    if (admin) {
      const user = await admin.auth().createUser({ email, password, displayName: name || '' });
      const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      respond(res, { token });
    } else {
      // Mock registration for development
      const token = jwt.sign({ uid: 'mock-uid', email, name }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      respond(res, { token, user: { email, name } });
    }
  } catch (err) {
    error(res, 'Registration failed');
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (admin) {
      const user = await admin.auth().getUserByEmail(email);
      const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      respond(res, { token });
    } else {
      // Mock login for development
      const token = jwt.sign({ uid: 'mock-uid', email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
      respond(res, { token, user: { email } });
    }
  } catch (err) {
    error(res, 'Invalid credentials', 400);
  }
});

router.get('/api/users/me', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User) {
      const user = await User.findOne({ firebaseUid: req.user.uid }).select('-__v');
      if (!user) return error(res, 'User not found', 404);
      respond(res, user);
    } else {
      // Mock user data
      respond(res, {
        uid: req.user.uid,
        email: req.user.email || 'user@example.com',
        name: req.user.name || 'Test User'
      });
    }
  } catch (err) {
    error(res, 'Server error');
  }
});

router.put('/api/users/me', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User) {
      let user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      if (req.body.name) user.name = req.body.name;
      user.updatedAt = Date.now();
      await user.save();

      respond(res, user);
    } else {
      // Mock update response
      respond(res, {
        uid: req.user.uid,
        email: req.user.email || 'user@example.com',
        name: req.body.name || req.user.name || 'Test User',
        updatedAt: new Date()
      });
    }
  } catch (err) {
    error(res, 'Update failed');
  }
});

router.delete('/api/users/me', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User) {
      await User.findOneAndRemove({ firebaseUid: req.user.uid });
    }
    respond(res, { msg: 'User deleted' });
  } catch (err) {
    error(res, 'Delete failed');
  }
});

router.post('/api/skincare-profile', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User && Profile) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      const { skinType, skinConcerns, preferences, sustainabilityPreference } = req.body;
      let profile = await Profile.findOne({ user: user._id });

      const profileData = {
        skinType,
        skinConcerns: skinConcerns || [],
        preferences: preferences || [],
        sustainabilityPreference: sustainabilityPreference || false,
        updatedAt: Date.now()
      };

      if (profile) {
        Object.assign(profile, profileData);
      } else {
        profile = new Profile({
          user: user._id,
          ...profileData
        });
      }

      await profile.save();
      respond(res, profile);
    } else {
      // Mock profile save
      const { skinType, skinConcerns, preferences, sustainabilityPreference } = req.body;
      respond(res, {
        uid: req.user.uid,
        skinType,
        skinConcerns: skinConcerns || [],
        preferences: preferences || [],
        sustainabilityPreference: sustainabilityPreference || false,
        updatedAt: new Date()
      });
    }
  } catch (err) {
    error(res, 'Could not save profile');
  }
});

router.get('/api/skincare-profile', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User && Profile) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      const profile = await Profile.findOne({ user: user._id });
      if (!profile) return error(res, 'Profile not found', 404);

      respond(res, profile);
    } else {
      // Mock profile data
      respond(res, {
        uid: req.user.uid,
        skinType: 'normal',
        skinConcerns: ['dryness'],
        preferences: ['fragrance-free'],
        sustainabilityPreference: false
      });
    }
  } catch (err) {
    error(res, 'Could not retrieve profile');
  }
});

router.get('/api/products', async (req, res) => {
  try {
    if (isMongoConnected() && Product) {
      const { skinType, skinConcern, isSustainable, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
      const query = {};

      if (skinType) query.skinTypes = skinType;
      if (skinConcern) query.skinConcerns = skinConcern;
      if (isSustainable === 'true') query.isSustainable = true;
      if (brand) query.brand = brand;

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = minPrice;
        if (maxPrice) query.price.$lte = maxPrice;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const products = await Product.find(query)
        .sort({ rating: -1 })
        .limit(parseInt(limit))
        .skip(skip);

      const total = await Product.countDocuments(query);

      respond(res, {
        products,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      // Use mock data when MongoDB is not available
      respond(res, {
        products: mockProducts,
        pagination: {
          total: mockProducts.length,
          page: 1,
          limit: 10,
          pages: 1
        }
      });
    }
  } catch (err) {
    error(res, 'Could not retrieve products');
  }
});

router.get('/api/products/:id', async (req, res) => {
  try {
    if (isMongoConnected() && Product) {
      const product = await Product.findById(req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    } else {
      // Mock product by ID
      const product = mockProducts.find(p => p._id === req.params.id);
      if (!product) return error(res, 'Product not found', 404);
      respond(res, product);
    }
  } catch (err) {
    error(res, 'Could not retrieve product');
  }
});

router.get('/api/recommendations', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User && Profile && Product) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      const profile = await Profile.findOne({ user: user._id });
      if (!profile) return error(res, 'Profile not found', 404);

      const query = { skinTypes: profile.skinType };
      if (profile.skinConcerns?.length > 0) query.skinConcerns = { $in: profile.skinConcerns };
      if (profile.sustainabilityPreference) query.isSustainable = true;

      const recommendations = await Product.find(query).sort({ rating: -1 }).limit(10);
      respond(res, recommendations);
    } else {
      // Mock recommendations
      respond(res, mockProducts);
    }
  } catch (err) {
    error(res, 'Could not retrieve recommendations');
  }
});

const getRecommendations = async (query, res) => {
  try {
    if (isMongoConnected() && Product) {
      const products = await Product.find(query).sort({ rating: -1 }).limit(10);
      respond(res, products);
    } else {
      // Mock recommendations based on query
      let filteredProducts = mockProducts;
      if (query.isSustainable) {
        filteredProducts = mockProducts.filter(p => p.isSustainable);
      }
      if (query.skinTypes) {
        filteredProducts = mockProducts.filter(p => p.skinTypes.includes(query.skinTypes));
      }
      respond(res, filteredProducts);
    }
  } catch (err) {
    error(res, 'Could not retrieve recommendations');
  }
};

router.get('/api/recommendations/trending', (req, res) => getRecommendations({}, res));
router.get('/api/recommendations/sustainable', (req, res) => getRecommendations({ isSustainable: true }, res));
router.get('/api/recommendations/skin-type/:type', (req, res) => {
  const validTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
  if (!validTypes.includes(req.params.type)) return error(res, 'Invalid skin type', 400);
  getRecommendations({ skinTypes: req.params.type }, res);
});

module.exports = router;
