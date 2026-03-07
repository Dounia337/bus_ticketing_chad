require('dotenv').config();

/**
 * Central configuration file for the application
 * All environment variables are accessed through this module
 */
module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // WhatsApp Business API
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  },
  
  // Email (SMTP)
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    from: process.env.SMTP_FROM || 'Bus Tchad <noreply@buschad.com>',
  },
  
  // Mobile Money
  momo: {
    apiUrl: process.env.MOMO_API_URL,
    apiKey: process.env.MOMO_API_KEY,
    merchantId: process.env.MOMO_MERCHANT_ID,
  },
  
  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Luggage configuration
  luggage: {
    defaultFreeKg: parseInt(process.env.DEFAULT_FREE_LUGGAGE_KG) || 20,
    extraFeePerKg: parseInt(process.env.EXTRA_LUGGAGE_FEE_PER_KG) || 500,
  },
  
  // CORS settings
  corsOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
};
