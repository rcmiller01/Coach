-- Alpha Release Foundation Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS app_events;
DROP TABLE IF EXISTS app_logs;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. App Logs Table (Structured logging)
CREATE TABLE IF NOT EXISTS app_logs (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(50) NOT NULL, -- 'info', 'warn', 'error'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255),
    message TEXT,
    meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_ts ON app_logs(ts);

-- 3. App Events Table (Key business events)
CREATE TABLE IF NOT EXISTS app_events (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- e.g., 'workout_logged', 'onboarding_completed'
    meta JSONB
);

CREATE INDEX IF NOT EXISTS idx_app_events_user_id ON app_events(user_id);
CREATE INDEX IF NOT EXISTS idx_app_events_type ON app_events(type);

-- 4. User Settings Table (Preferences)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
