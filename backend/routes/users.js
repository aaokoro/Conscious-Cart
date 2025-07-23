const express = require('express');
const router = express.Router();
const { auth } = require('../middleware');
const mongoose = require('mongoose');

const isMongoConnected = () => mongoose.connection.readyState === 1;

let User, Profile;
try {
  const models = require('../models');
  User = models.User;
  Profile = models.Profile;
} catch (err) {
  // Error loading models
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.get('/me', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User) {
      const user = await User.findOne({ firebaseUid: req.user.uid }).select('-__v');
      if (!user) return error(res, 'User not found', 404);
      respond(res, user);
    } else {
      respond(res, {
        uid: req.user.uid,
        email: req.user.email || 'user@example.com',
        name: req.user.name || 'Test User'
      });
    }
  } catch (err) {
    error(res, 'Server error', 500);
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2 || name.trim().length > 50) {
      return error(res, 'Name must be between 2 and 50 characters', 400);
    }

    const user = await User.findById(req.user.uid);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    user.name = name.trim();
    await user.save();

    respond(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (err) {
    error(res, 'Update failed', 500);
  }
});

router.delete('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Delete user's profile if it exists
    await Profile.findOneAndDelete({ user: user._id });

    // Delete the user
    await User.findByIdAndDelete(user._id);

    respond(res, { msg: 'User deleted successfully' });
  } catch (err) {
    error(res, 'Delete failed', 500);
  }
});

router.post('/skincare-profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    const { skinType, skinConcerns, preferences, sustainabilityPreference } = req.body;

    // Validate skinType
    const validSkinTypes = ['oily', 'dry', 'combination', 'normal', 'sensitive'];
    if (!skinType || !validSkinTypes.includes(skinType)) {
      return error(res, 'Valid skin type is required', 400);
    }

    // Validate skinConcerns
    const validSkinConcerns = ['acne', 'aging', 'dryness', 'sensitivity', 'hyperpigmentation', 'redness'];
    if (skinConcerns && !Array.isArray(skinConcerns)) {
      return error(res, 'Skin concerns must be an array', 400);
    }
    if (skinConcerns && skinConcerns.some(concern => !validSkinConcerns.includes(concern))) {
      return error(res, 'Invalid skin concern provided', 400);
    }

    // Validate preferences
    const validPreferences = ['fragrance-free', 'paraben-free', 'sulfate-free', 'cruelty-free', 'vegan', 'organic'];
    if (preferences && !Array.isArray(preferences)) {
      return error(res, 'Preferences must be an array', 400);
    }
    if (preferences && preferences.some(pref => !validPreferences.includes(pref))) {
      return error(res, 'Invalid preference provided', 400);
    }

    let profile = await Profile.findOne({ user: user._id });

    const profileData = {
      skinType,
      skinConcerns: skinConcerns || [],
      preferences: preferences || [],
      sustainabilityPreference: sustainabilityPreference || false
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
    error(res, 'Could not save profile', 500);
  }
});

router.get('/skincare-profile', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User && Profile) {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      const profile = await Profile.findOne({ user: user._id });
      if (!profile) return error(res, 'Profile not found', 404);

      respond(res, profile);
    } else {
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

module.exports = router;
