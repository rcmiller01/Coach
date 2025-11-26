-- Nutrition Database Schema
-- Version: 1.0
-- Purpose: Store generic foods, branded items, and support AI-assisted food parsing

-- Generic foods from USDA and other official sources
CREATE TABLE IF NOT EXISTS nutrition_generic_foods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'en-US',
    default_unit TEXT NOT NULL, -- 'g' | 'ml' | 'piece' | 'cup' | 'oz' | 'serving'
    grams_per_unit FLOAT NOT NULL DEFAULT 1.0,
    calories_per_100g FLOAT NOT NULL,
    protein_per_100g FLOAT NOT NULL,
    carbs_per_100g FLOAT NOT NULL,
    fats_per_100g FLOAT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT,
    is_official BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generic_foods_name ON nutrition_generic_foods(name);
CREATE INDEX idx_generic_foods_locale ON nutrition_generic_foods(locale);

-- Brands (e.g., Subway, McDonald's, Starbucks)
CREATE TABLE IF NOT EXISTS nutrition_brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    locale TEXT NOT NULL DEFAULT 'en-US',
    source_label TEXT NOT NULL,
    source_url TEXT,
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brands_name ON nutrition_brands(name);

-- Branded food items from restaurant menus
CREATE TABLE IF NOT EXISTS nutrition_brand_items (
    id SERIAL PRIMARY KEY,
    brand_id INTEGER NOT NULL REFERENCES nutrition_brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'en-US',
    default_unit TEXT NOT NULL DEFAULT 'serving',
    grams_per_unit FLOAT, -- nullable for serving-based items
    calories_per_unit FLOAT NOT NULL,
    protein_per_unit FLOAT NOT NULL,
    carbs_per_unit FLOAT NOT NULL,
    fats_per_unit FLOAT NOT NULL,
    source_label TEXT NOT NULL,
    source_url TEXT,
    is_official BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_items_name ON nutrition_brand_items(name);
CREATE INDEX idx_brand_items_brand ON nutrition_brand_items(brand_id);
CREATE INDEX idx_brand_items_locale ON nutrition_brand_items(locale);

-- Optional: Ingredients for composite recipe calculation
CREATE TABLE IF NOT EXISTS nutrition_ingredients (
    id SERIAL PRIMARY KEY,
    generic_food_id INTEGER NOT NULL REFERENCES nutrition_generic_foods(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User quota tracking for AI operations
CREATE TABLE IF NOT EXISTS user_ai_quota (
    user_id TEXT PRIMARY KEY,
    daily_plan_generations_used INTEGER NOT NULL DEFAULT 0,
    daily_food_parses_used INTEGER NOT NULL DEFAULT 0,
    reset_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_quota_reset ON user_ai_quota(reset_at);

-- Weekly Nutrition Plans (JSON persistence)
CREATE TABLE IF NOT EXISTS weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start_date)
);

CREATE INDEX idx_weekly_plans_user_date ON weekly_plans(user_id, week_start_date);
