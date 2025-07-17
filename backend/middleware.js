const jwt = require('jsonwebtoken');
const { AUTH_CONFIG } = require('./config/constants');

const respond = (res, data, status = 200) => res.status(status).json(data);
const error = (res, msg, status = 500) => res.status(status).json({ msg });

const auth = (req, res, next) => {
  // Get token from header
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  // Check if no token
  if (!token) {
    return error(res, 'No token, authorization denied', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, AUTH_CONFIG.JWT_SECRET);

    // Add user from payload to request object
    req.user = decoded;
    next();
  } catch (err) {
    error(res, 'Token is not valid', 401);
  }
};

module.exports = {
  auth,
  respond,
  error
};
