const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AUTH_CONFIG, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

const { AUTH_CONFIG, HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

let admin = null;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const firebaseAdmin = require('firebase-admin');
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.applicationDefault() });
    }
    admin = firebaseAdmin;
  } catch (err) {
    admin = null;
  }
} else {
  admin = null;
}

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

router.post('/register', [
  check('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  check('email').isEmail().withMessage('Please enter a valid email'),
  check('password').isLength({ min: AUTH_CONFIG.PASSWORD_MIN_LENGTH }).withMessage(`Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters long`)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, errors.array()[0].msg, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, 'User already exists with this email', HTTP_STATUS.CONFLICT);
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      {
        uid: user._id,
        email: user.email,
        name: user.name
      },
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN }
    );

    respond(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    }, HTTP_STATUS.CREATED);

  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return error(res, 'User already exists with this email', HTTP_STATUS.CONFLICT);
    }
    error(res, ERROR_MESSAGES.REGISTRATION_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
});

router.post('/login', [
  check('email').isEmail().withMessage('Please enter a valid email'),
  check('password').exists().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, errors.array()[0].msg, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Create JWT token
    const token = jwt.sign(
      {
        uid: user._id,
        email: user.email,
        name: user.name
      },
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN }
    );

    respond(res, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
=======
  check('email').isEmail(),
  check('password').isLength({ min: AUTH_CONFIG.PASSWORD_MIN_LENGTH })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return error(res, ERROR_MESSAGES.INVALID_INPUT, HTTP_STATUS.BAD_REQUEST);

  try {
    const { email, password, name } = req.body;

    if (admin) {
      const user = await admin.auth().createUser({ email, password, displayName: name || '' });
      const token = jwt.sign({ uid: user.uid }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN });
      respond(res, { token });
    } else {
      const token = jwt.sign({ uid: 'mock-uid', email, name }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN });
      respond(res, { token, user: { email, name } });
    }
  } catch (err) {
    error(res, ERROR_MESSAGES.REGISTRATION_FAILED);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (admin) {
      const user = await admin.auth().getUserByEmail(email);
      const token = jwt.sign({ uid: user.uid }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN });
      respond(res, { token });
    } else {
      const token = jwt.sign({ uid: 'mock-uid', email }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN });
      respond(res, { token, user: { email } });
    }
  } catch (err) {
    error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.BAD_REQUEST);
  }
});

module.exports = router;
