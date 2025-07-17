const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AUTH_CONFIG, HTTP_STATUS, ERROR_MESSAGES } = require('./config/constants');

const users = [];

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

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
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return error(res, 'User already exists with this email', HTTP_STATUS.CONFLICT);
    }

    // Create new user with hashed password
    const hashedPassword = await hashPassword(password);
    const userId = Date.now().toString();
    const newUser = {
      _id: userId,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to in-memory storage
    users.push(newUser);

    // Create JWT token
    const token = jwt.sign(
      {
        uid: newUser._id,
        email: newUser.email,
        name: newUser.name
      },
      AUTH_CONFIG.JWT_SECRET,
      { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN }
    );

    respond(res, {
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    }, HTTP_STATUS.CREATED);

  } catch (err) {
    console.error('Registration error:', err);
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
    const user = users.find(user => user.email === email);
    if (!user) {
      return error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
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
  }
});

// Add a simple test endpoint
router.get('/test', (_req, res) => {
  respond(res, { message: 'Auth API is working!' });
});

module.exports = router;
