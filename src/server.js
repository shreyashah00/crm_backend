// Load environment variables first
require('dotenv').config();

const app = require('./app');
const { pool, prisma } = require('./lib/prisma');

const PORT = process.env.PORT || 5001;
const HOST = '0.0.0.0';

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`=============================================`);
  console.log(`🚀 Smart CRM Mulyaankan Server is running!`);
  console.log(`📡 Listening on host ${HOST} port: ${PORT}`);
  console.log(`📖 Swagger API Docs: http://localhost:${PORT}/api-docs`);
  console.log(`💻 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=============================================`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      // Disconnect Prisma Client
      await prisma.$disconnect();
      console.log('Prisma Client disconnected.');
      
      // Close Database Pool
      await pool.end();
      console.log('Database connection pool closed.');
      
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
