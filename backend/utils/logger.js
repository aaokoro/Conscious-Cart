

const NODE_ENV = process.env.NODE_ENV || 'development';

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};


const config = {
  production: {
    [LOG_LEVELS.ERROR]: true,
    [LOG_LEVELS.WARN]: true,
    [LOG_LEVELS.INFO]: false,
    [LOG_LEVELS.DEBUG]: false
  },
  // Log everything in development
  development: {
    [LOG_LEVELS.ERROR]: true,
    [LOG_LEVELS.WARN]: true,
    [LOG_LEVELS.INFO]: true,
    [LOG_LEVELS.DEBUG]: true
  },
  //  log errors in test
  test: {
    [LOG_LEVELS.ERROR]: true,
    [LOG_LEVELS.WARN]: false,
    [LOG_LEVELS.INFO]: false,
    [LOG_LEVELS.DEBUG]: false
  }
};


const getConfig = () => {
  return config[NODE_ENV] || config.development;
};


const formatMessage = (level, message, ...args) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};


const logger = {
  error: (message, ...args) => {
    if (getConfig()[LOG_LEVELS.ERROR]) {
      console.error(formatMessage(LOG_LEVELS.ERROR, message), ...args);
    }
  },

  warn: (message, ...args) => {
    if (getConfig()[LOG_LEVELS.WARN]) {
      console.warn(formatMessage(LOG_LEVELS.WARN, message), ...args);
    }
  },

  info: (message, ...args) => {
    if (getConfig()[LOG_LEVELS.INFO]) {
      console.info(formatMessage(LOG_LEVELS.INFO, message), ...args);
    }
  },

  debug: (message, ...args) => {
    if (getConfig()[LOG_LEVELS.DEBUG]) {
      console.debug(formatMessage(LOG_LEVELS.DEBUG, message), ...args);
    }
  }
};

module.exports = logger;
