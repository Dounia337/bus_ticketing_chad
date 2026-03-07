const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const tripRoutes = require('./routes/tripRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Enable CORS
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - important for unstable connections
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    messageKey: 'RATE_LIMIT_EXCEEDED',
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging (development)
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    messageKey: 'NOT_FOUND',
    message: 'Route non trouvée',
    path: req.path,
  });
});

// ============================================================================
// ERROR HANDLER
// ============================================================================

app.use((error, req, res, next) => {
  console.error('Server error:', error);

  // Prisma errors
  if (error.code && error.code.startsWith('P')) {
    return res.status(400).json({
      messageKey: 'DATABASE_ERROR',
      message: 'Erreur de base de données',
      error: config.nodeEnv === 'development' ? error.message : undefined,
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      messageKey: 'VALIDATION_ERROR',
      message: error.message,
    });
  }

  // Default error
  res.status(error.status || 500).json({
    messageKey: 'SERVER_ERROR',
    message: error.message || 'Erreur serveur',
    error: config.nodeEnv === 'development' ? error.stack : undefined,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚌 Bus Ticketing System - Backend API');
  console.log('='.repeat(60));
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60) + '\n');
  console.log('📋 Available endpoints:');
  console.log('  - POST   /api/auth/register');
  console.log('  - POST   /api/auth/login');
  console.log('  - GET    /api/trips/search');
  console.log('  - POST   /api/bookings');
  console.log('  - GET    /api/bookings/:code');
  console.log('  - POST   /api/admin/routes');
  console.log('  - POST   /api/admin/buses');
  console.log('  - POST   /api/admin/trips');
  console.log('\n💡 Tip: Configure .env file with your credentials\n');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
