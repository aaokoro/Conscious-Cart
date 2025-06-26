const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const { User, Profile, Product } = require('./models');
const { auth } = require('./middleware');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
}

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
    const user = await admin.auth().createUser({ email, password, displayName: name || '' });
    const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    respond(res, { token });
  } catch (err) {
    error(res, 'Registration failed');
  }
});

router.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await admin.auth().getUserByEmail(email);
    const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    respond(res, { token });
  } catch (err) {
    error(res, 'Invalid credentials', 400);
  }
});

router.get('/api/users/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid }).select('-__v');
    if (!user) return error(res, 'User not found', 404);
    respond(res, user);
  } catch (err) {
    error(res, 'Server error');
  }
});

router.put('/api/users/me', auth, async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);

    if (req.body.name) user.name = req.body.name;
    user.updatedAt = Date.now();
    await user.save();

    respond(res, user);
  } catch (err) {
    error(res, 'Update failed');
  }
});

router.delete('/api/users/me', auth, async (req, res) => {
  try {
    await User.findOneAndRemove({ firebaseUid: req.user.uid });
    respond(res, { msg: 'User deleted' });
  } catch (err) {
    error(res, 'Delete failed');
  }
});

router.post('/api/skincare-profile', auth, async (req, res) => {
  try {
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
  } catch (err) {
    error(res, 'Could not save profile');
  }
});

router.get('/api/skincare-profile', auth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);

    const profile = await Profile.findOne({ user: user._id });
    if (!profile) return error(res, 'Profile not found', 404);

    respond(res, profile);
  } catch (err) {
    error(res, 'Could not retrieve profile');
  }
});

router.get('/api/products', async (req, res) => {
  try {
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
  } catch (err) {
    error(res, 'Could not retrieve products');
  }
});

router.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return error(res, 'Product not found', 404);
    respond(res, product);
  } catch (err) {
    error(res, 'Could not retrieve product');
  }
});
router.get('/api/recommendations', auth, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return error(res, 'User not found', 404);

    const profile = await Profile.findOne({ user: user._id });
    if (!profile) return error(res, 'Profile not found', 404);

    const query = { skinTypes: profile.skinType };
    if (profile.skinConcerns?.length > 0) query.skinConcerns = { $in: profile.skinConcerns };
    if (profile.sustainabilityPreference) query.isSustainable = true;

    const recommendations = await Product.find(query).sort({ rating: -1 }).limit(10);
    respond(res, recommendations);
  } catch (err) {
    error(res, 'Could not retrieve recommendations');
  }
});

const getRecommendations = async (query, res) => {
  try {
    const products = await Product.find(query).sort({ rating: -1 }).limit(10);
    respond(res, products);
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
