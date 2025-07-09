const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { auth } = require('../middleware');

const isMongoConnected = () => mongoose.connection.readyState === 1;

let User, Profile;
try {
  const models = require('../models');
  User = models.User;
  Profile = models.Profile;
} catch (err) {
  // Models not available - using mock data
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
      // Mock user data when database is not connected
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

router.put('/me', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User) {
      let user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return error(res, 'User not found', 404);

      if (req.body.name) user.name = req.body.name;
      user.updatedAt = Date.now();
      await user.save();

      respond(res, user);
    } else {
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

router.delete('/me', auth, async (req, res) => {
  try {
    if (isMongoConnected() && User) {
      await User.findOneAndRemove({ firebaseUid: req.user.uid });
    }
    respond(res, { msg: 'User deleted' });
  } catch (err) {
    error(res, 'Delete failed');
  }
});

router.post('/skincare-profile', auth, async (req, res) => {
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
