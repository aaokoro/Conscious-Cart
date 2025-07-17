require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { SERVER_CONFIG, DATABASE_CONFIG, HTTP_STATUS } = require('./config/constants');

const logger = {
  info: (message) => {
    // Keep essential server startup logs
    if (message.includes('MongoDB connected') || message.includes('Server running on port')) {
      process.stdout.write(`[INFO] ${message}\n`);
    }
  },
  error: (message, error) => {
    if (message.includes('MongoDB connection error')) {
      process.stderr.write(`[ERROR] ${message} ${error?.message || ''}\n`);
    }
  }
};

const app = express();

app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGIN
}));
app.use(express.json({ limit: SERVER_CONFIG.BODY_PARSER_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: SERVER_CONFIG.BODY_PARSER_LIMIT }));

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

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
