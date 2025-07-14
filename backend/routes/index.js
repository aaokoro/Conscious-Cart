const express = require('express');
const router = express.Router();

const authRoutes = require('./auth-simple');
const debugAuthRoutes = require('./debug-auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const favoriteRoutes = require('./favorites');
const recommendationRoutes = require('../ml/recommendations');

router.use('/api/auth', authRoutes);
router.use('/api/auth', debugAuthRoutes);
router.use('/api/users', userRoutes);
router.use('/api', userRoutes);
router.use('/', productRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/api/recommendations', recommendationRoutes);

module.exports = router;
