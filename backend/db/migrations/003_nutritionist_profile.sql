-- AI Nutritionist Profile Storage
CREATE TABLE IF NOT EXISTS nutritionist_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  profile JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for performance (though PK is already indexed)
CREATE INDEX IF NOT EXISTS idx_nutritionist_profiles_updated ON nutritionist_profiles(updated_at);
