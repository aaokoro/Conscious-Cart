require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { SERVER_CONFIG, DATABASE_CONFIG, HTTP_STATUS } = require('./config/constants');

const logger = {
  info: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[INFO] ${message}`);
    }
  },
  error: (message, error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[ERROR] ${message}`, error?.message || '');
    }
  }
};

const app = express();

app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN
}));
app.use(express.json({ limit: SERVER_CONFIG.BODY_PARSER_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: SERVER_CONFIG.BODY_PARSER_LIMIT }));
app.use(require('./routes'));
app.use((err, _req, res, _next) => res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({ error: err.message }));

mongoose.connect(DATABASE_CONFIG.MONGODB_URI, {
  serverSelectionTimeoutMS: DATABASE_CONFIG.DB_CONNECTION_TIMEOUT
})
  .then(() => logger.info('MongoDB connected'))
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    logger.info('Running without MongoDB - some features may be limited');
  });

app.listen(SERVER_CONFIG.PORT, () => logger.info(`Server running on port ${SERVER_CONFIG.PORT}`));
