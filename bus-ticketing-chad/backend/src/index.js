/**
 * Chad Bus Ticketing System - Backend Entry Point
 * 
 * Production-ready Express server with:
 * - Mobile-first API design
 * - Manual override capabilities for admins
 * - WhatsApp-first notification system
 * - Mobile Money payment integration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { prisma } = require('./config/database');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

// CORS configuration - Allow frontend access
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api', routes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

// Graceful shutdown handler
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    app.listen(PORT, () => {
      logger.info(`🚌 Chad Bus Ticketing API running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🌍 Frontend URL: ${process.env.FRONTEND_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
