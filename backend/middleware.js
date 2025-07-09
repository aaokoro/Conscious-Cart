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

module.exports = {
  auth,
  respond,
  error
};
