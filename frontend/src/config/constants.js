// Frontend Configuration Constants
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 20,
  DEFAULT_PAGE_NUMBER: parseInt(import.meta.env.VITE_DEFAULT_PAGE_NUMBER) || 1,
  MAX_SEARCH_RESULTS: parseInt(import.meta.env.VITE_MAX_SEARCH_RESULTS) || 20,
  RECOMMENDATIONS_LIMIT: parseInt(import.meta.env.VITE_RECOMMENDATIONS_LIMIT) || 12,
  TRENDING_PRODUCTS_LIMIT: parseInt(import.meta.env.VITE_TRENDING_PRODUCTS_LIMIT) || 10,
  REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_REQUEST_TIMEOUT) || 10000,
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_RETRY_ATTEMPTS) || 3,
}

export const AUTH_CONFIG = {
  TOKEN_STORAGE_KEY: import.meta.env.VITE_TOKEN_STORAGE_KEY || 'skinfluence_auth_token',
  TOKEN_HEADER_PREFIX: import.meta.env.VITE_TOKEN_HEADER_PREFIX || 'Bearer',
}

export const UI_CONFIG = {
  ITEMS_PER_PAGE: parseInt(import.meta.env.VITE_ITEMS_PER_PAGE) || 12,
  SEARCH_DEBOUNCE_MS: parseInt(import.meta.env.VITE_SEARCH_DEBOUNCE_MS) || 300,
  NOTIFICATION_DURATION: parseInt(import.meta.env.VITE_NOTIFICATION_DURATION) || 5000,
}
export const ERROR_MESSAGES = {
  NETWORK_ERROR: import.meta.env.VITE_NETWORK_ERROR_MSG || 'Network error. Please check your connection and try again.',
  SERVICE_UNAVAILABLE: import.meta.env.VITE_SERVICE_UNAVAILABLE_MSG || 'Service temporarily unavailable. Please try again later.',
  AUTHENTICATION_REQUIRED: import.meta.env.VITE_AUTH_REQUIRED_MSG || 'Authentication required. Please log in.',
  INVALID_CREDENTIALS: import.meta.env.VITE_INVALID_CREDENTIALS_MSG || 'Invalid credentials. Please check your email and password.',
  GENERIC_ERROR: import.meta.env.VITE_GENERIC_ERROR_MSG || 'An unexpected error occurred. Please try again.',
  VALIDATION_ERROR: import.meta.env.VITE_VALIDATION_ERROR_MSG || 'Please fill in all required fields correctly.',
}

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

export const ENDPOINTS = {
  PRODUCTS: '/products',
  PRODUCT_SEARCH: '/product',
  INGREDIENTS: '/ingredients',
  INGREDIENT_SEARCH: '/ingredient',
  FAVORITES: '/favorites',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  USER_PROFILE: '/api/users/me',
}
