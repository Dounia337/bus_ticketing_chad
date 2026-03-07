/**
 * Logger Utility
 * Simple console-based logger with timestamp and log levels
 */

const logLevels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const colors = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m',
};

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.INFO;
  const reset = colors.RESET;
  
  let logMessage = `${color}[${timestamp}] [${level}]${reset} ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

const logger = {
  error: (message, data) => log(logLevels.ERROR, message, data),
  warn: (message, data) => log(logLevels.WARN, message, data),
  info: (message, data) => log(logLevels.INFO, message, data),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      log(logLevels.DEBUG, message, data);
    }
  },
};

module.exports = logger;
