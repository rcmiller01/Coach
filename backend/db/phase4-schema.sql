-- ============================================================================
-- PHASE 4: QUOTA TRACKING & USAGE LOGGING
-- ============================================================================

-- Daily AI usage tracking per user
CREATE TABLE IF NOT EXISTS user_ai_usage_daily (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  parse_food_calls INTEGER DEFAULT 0,
  tokens_used INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_ai_usage_user_date ON user_ai_usage_daily(user_id, date);

-- Usage event logging for analytics
CREATE TABLE IF NOT EXISTS parse_food_events (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  text_hash VARCHAR(64), -- SHA-256 hash of input text for pattern analysis
  provenance VARCHAR(20), -- 'official' or 'estimated'
  confidence VARCHAR(20), -- 'low', 'medium', 'high'
  user_adjusted BOOLEAN DEFAULT FALSE,
  calories INTEGER,
  protein_grams DECIMAL(5,1),
  carbs_grams DECIMAL(5,1),
  fats_grams DECIMAL(5,1),
  error_code VARCHAR(50), -- null on success, or AI_PARSE_FAILED, AI_TIMEOUT, etc.
  duration_ms INTEGER, -- how long parseFood took
  tokens_used INTEGER -- OpenAI token count (if available)
);

CREATE INDEX idx_parse_food_events_user ON parse_food_events(user_id);
CREATE INDEX idx_parse_food_events_timestamp ON parse_food_events(timestamp);
CREATE INDEX idx_parse_food_events_error ON parse_food_events(error_code) WHERE error_code IS NOT NULL;

-- Admin controls
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  ai_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update user_ai_usage_daily.last_updated
CREATE OR REPLACE FUNCTION update_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_ai_usage_updated
  BEFORE UPDATE ON user_ai_usage_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_timestamp();

-- Analytics helper views
CREATE OR REPLACE VIEW daily_usage_summary AS
SELECT 
  date,
  COUNT(DISTINCT user_id) as active_users,
  SUM(parse_food_calls) as total_parses,
  SUM(tokens_used) as total_tokens,
  ROUND(AVG(parse_food_calls)::numeric, 2) as avg_parses_per_user
FROM user_ai_usage_daily
GROUP BY date
ORDER BY date DESC;

CREATE OR REPLACE VIEW parse_quality_metrics AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_parses,
  COUNT(*) FILTER (WHERE error_code IS NULL) as successful_parses,
  COUNT(*) FILTER (WHERE error_code IS NOT NULL) as failed_parses,
  COUNT(*) FILTER (WHERE provenance = 'official') as official_matches,
  COUNT(*) FILTER (WHERE provenance = 'estimated') as estimates,
  COUNT(*) FILTER (WHERE user_adjusted = true) as user_adjusted_count,
  ROUND(AVG(duration_ms)::numeric, 0) as avg_duration_ms
FROM parse_food_events
GROUP BY DATE(timestamp)
ORDER BY date DESC;

COMMENT ON TABLE user_ai_usage_daily IS 'Daily quota tracking per user for parseFood calls';
COMMENT ON TABLE parse_food_events IS 'Detailed event log for parseFood calls, used for analytics and pattern detection';
COMMENT ON TABLE users IS 'User table with admin controls like ai_enabled kill switch';
COMMENT ON COLUMN parse_food_events.text_hash IS 'SHA-256 hash of input text to detect patterns without storing raw user input';
COMMENT ON COLUMN users.ai_enabled IS 'Admin kill switch: when false, all AI features are disabled for this user';
