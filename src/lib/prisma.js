const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

// SSL configuration for hosted cloud databases (Render, Supabase, Neon, Railway, AWS, etc.)
const needsSsl = Boolean(
  connectionString && (connectionString.includes('sslmode=require') || connectionString.includes('ssl=true') || isProduction)
);

// Create the driver pool using pg
const pool = new Pool({
  connectionString,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ...(needsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Configure the Prisma PG adapter
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient with the adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

module.exports = {
  prisma,
  pool,
};
