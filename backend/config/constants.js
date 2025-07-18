// Backend Configuration Constants
require('dotenv').config();

const API_CONFIG = {
  DEFAULT_PAGE_SIZE: parseInt(process.env.DEFAULT_PAGE_SIZE) || 20,
  DEFAULT_PAGE_NUMBER: parseInt(process.env.DEFAULT_PAGE_NUMBER) || 1,
  MAX_SEARCH_RESULTS: parseInt(process.env.MAX_SEARCH_RESULTS) || 50,
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

const AUTH_CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET environment variable is required');
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 6,
  PASSWORD_MAX_LENGTH: parseInt(process.env.PASSWORD_MAX_LENGTH) || 128,
  TOKEN_HEADER_NAME: process.env.TOKEN_HEADER_NAME || 'authorization',
  TOKEN_PREFIX: process.env.TOKEN_PREFIX || 'Bearer ',
};

const DATABASE_CONFIG = {
  MONGODB_URI: process.env.MONGODB_URI || (() => {
    throw new Error('MONGODB_URI environment variable is required');
  })(),
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  DB_RETRY_ATTEMPTS: parseInt(process.env.DB_RETRY_ATTEMPTS) || 3,
};

const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  BODY_PARSER_LIMIT: process.env.BODY_PARSER_LIMIT || '10mb',
};

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

const ERROR_MESSAGES = {
  INVALID_INPUT: process.env.INVALID_INPUT_MSG || 'Invalid input provided',
  REGISTRATION_FAILED: process.env.REGISTRATION_FAILED_MSG || 'Registration failed',
  INVALID_CREDENTIALS: process.env.INVALID_CREDENTIALS_MSG || 'Invalid credentials',
  AUTHENTICATION_REQUIRED: process.env.AUTH_REQUIRED_MSG || 'Authentication required',
  ACCESS_DENIED: process.env.ACCESS_DENIED_MSG || 'Access denied',
  RESOURCE_NOT_FOUND: process.env.RESOURCE_NOT_FOUND_MSG || 'Resource not found',
  DATABASE_ERROR: process.env.DATABASE_ERROR_MSG || 'Database operation failed',
  INTERNAL_ERROR: process.env.INTERNAL_ERROR_MSG || 'Internal server error',
  SERVICE_UNAVAILABLE: process.env.SERVICE_UNAVAILABLE_MSG || 'Service temporarily unavailable',
};

const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_REGEX: process.env.PASSWORD_REGEX || '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{6,}$',
  NAME_MIN_LENGTH: parseInt(process.env.NAME_MIN_LENGTH) || 2,
  NAME_MAX_LENGTH: parseInt(process.env.NAME_MAX_LENGTH) || 50,
};

const FIREBASE_CONFIG = {
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
};

const ENDPOINTS = {
  AUTH: '/api/auth',
  USERS: '/api/users',
  PRODUCTS: '/products',
  FAVORITES: '/favorites',
  RECOMMENDATIONS: '/recommendations',
  INGREDIENTS: '/ingredients',
};

module.exports = {
  API_CONFIG,
  AUTH_CONFIG,
  DATABASE_CONFIG,
  SERVER_CONFIG,
  HTTP_STATUS,
  ERROR_MESSAGES,
  VALIDATION_RULES,
  FIREBASE_CONFIG,
  ENDPOINTS,
};
