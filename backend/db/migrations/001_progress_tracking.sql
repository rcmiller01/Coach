-- Progress Tracking Migration
-- Creates tables for logging workout sessions, nutrition, and weight

-- Workout session logs
CREATE TABLE IF NOT EXISTS workout_sessions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  program_week_id VARCHAR(255),
  day_of_week VARCHAR(20),
  completed_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, date)
);

-- Individual set logs within a workout session
CREATE TABLE IF NOT EXISTS workout_set_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_name VARCHAR(255) NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_lbs DECIMAL(6,2),
  rpe DECIMAL(3,1),  -- Rate of perceived exertion 1-10
  notes TEXT
);

-- Nutrition day logs
CREATE TABLE IF NOT EXISTS nutrition_day_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  total_calories INTEGER,
  total_protein_grams DECIMAL(6,2),
  total_carbs_grams DECIMAL(6,2),
  total_fats_grams DECIMAL(6,2),
  logged_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Individual meal logs
CREATE TABLE IF NOT EXISTS nutrition_meal_logs (
  id SERIAL PRIMARY KEY,
  day_log_id INTEGER REFERENCES nutrition_day_logs(id) ON DELETE CASCADE,
  meal_type VARCHAR(50),  -- breakfast, lunch, dinner, snack
  meal_time TIME,
  food_items JSONB  -- Array of food items
);

-- Weight tracking
CREATE TABLE IF NOT EXISTS weight_log (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  weight_lbs DECIMAL(5,2) NOT NULL,
  logged_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_day_logs_user_date ON nutrition_day_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_log_user_date ON weight_log(user_id, date DESC);
