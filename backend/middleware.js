const jwt = require('jsonwebtoken');

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return error(res, 'No token, authorization denied', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    error(res, 'Token is not valid', 401);
  }
};

// Simple middleware for development without MongoDB
const simpleAuth = (_req, _res, next) => {
  // For development, allow all requests to pass through
  // In a real app, you would validate the token
  next();
};

module.exports = {
  auth: simpleAuth, // Use simpleAuth instead of auth for development without MongoDB
  respond,
  error
};
