/**
 * Database Configuration
 * Prisma client setup with connection pooling optimized for unstable connections
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Prisma client configuration optimized for Chad's internet conditions
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'minimal',
  // Connection pool settings for unstable networks
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection lifecycle logging
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
  }
});

// Test database connection
const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

module.exports = {
  prisma,
  testConnection,
};
