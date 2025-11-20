/**
 * Backend Server
 * 
 * Simple Express server that:
 * 1. Initializes PostgreSQL connection pool
 * 2. Initializes nutrition tools with the pool
 * 3. Serves the nutrition API routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as nutritionTools from './nutritionTools.js';
import * as routes from './routes.js';

// Load environment variables from .env file
dotenv.config();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - just log it
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Exit on uncaught exceptions
  process.exit(1);
});

// Load environment variables
const PORT = process.env.PORT || 3001;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.error('Please create a .env file with DATABASE_URL');
  process.exit(1);
}

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

// Initialize nutrition tools with database pool
nutritionTools.initializeDb(pool);
console.log('✅ Nutrition tools initialized');

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`📬 ${req.method} ${req.url}`);
  next();
});

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Mount nutrition API routes
app.get('/api/nutrition/plan', routes.getNutritionPlan);
app.post('/api/nutrition/plan/week', routes.generateWeeklyPlan);
app.post('/api/nutrition/plan/day', routes.generateDailyPlan);
app.put('/api/nutrition/plan/day/:date', routes.updateDayPlan);
app.post('/api/nutrition/plan/copy', routes.copyDayPlan);
app.post('/api/nutrition/plan/day/regenerate-meal', routes.regenerateMeal);
app.get('/api/meals/log/:date', routes.getDayLog);
app.put('/api/meals/log/:date', routes.saveDayLog);
app.post('/api/nutrition/parse-food', routes.parseFood);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Workout Coach - Nutrition API',
    version: '1.0.0',
    endpoints: {
      parseFood: 'POST /api/nutrition/parse-food',
      generateMealPlan: 'POST /api/nutrition/generate-meal-plan',
      health: 'GET /health'
    }
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      retryable: false
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🍎 Parse food: POST http://localhost:${PORT}/api/nutrition/parse-food`);
});

// Keep-alive to prevent process exit
setInterval(() => {
  console.log('💓 Backend alive...', new Date().toLocaleTimeString());
}, 5000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});
