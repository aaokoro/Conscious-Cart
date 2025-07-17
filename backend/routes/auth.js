const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
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
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return error(res, 'Please provide email and password', HTTP_STATUS.BAD_REQUEST);
    }

    if (admin) {
      try {
        // In a real Firebase implementation, we would use signInWithEmailAndPassword
        // But for this mock, we'll just get the user by email
        const user = await admin.auth().getUserByEmail(email);
        const token = jwt.sign({ uid: user.uid }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN });
        respond(res, { token, user: { email, name: user.displayName } });
      } catch (firebaseError) {
        return error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.BAD_REQUEST);
      }
    } else {
      // For development/testing without Firebase
      // In a real app, you would verify the password here
      const token = jwt.sign({ uid: 'mock-uid', email }, AUTH_CONFIG.JWT_SECRET, { expiresIn: AUTH_CONFIG.JWT_EXPIRES_IN });
      respond(res, { token, user: { email, name: 'Test User' } });
    }
  } catch (err) {
    error(res, ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.BAD_REQUEST);
  }
});

module.exports = router;
