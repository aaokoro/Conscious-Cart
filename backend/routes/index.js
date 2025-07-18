const express = require('express');
const router = express.Router();

const authRoutes = require('../auth-simple');
const userRoutes = require('./users');
const productRoutes = require('./products');
const favoriteRoutes = require('./favorites');
const recommendationRoutes = require('../ml/recommendations');

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api', userRoutes);
router.use('/', productRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/api/recommendations', recommendationRoutes);
router.use('/api/recommendations', recommendationRoutes);

module.exports = router;
