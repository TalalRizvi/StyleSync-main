-- Cost tracking table for Gemini API usage
-- Run this migration to add cost tracking to your D1 database

CREATE TABLE IF NOT EXISTS tryon_costs (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  brand_id TEXT,
  session_id TEXT,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  images_in INTEGER DEFAULT 1,
  images_out INTEGER DEFAULT 1,
  resolution TEXT,
  cost_usd REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX IF NOT EXISTS idx_tryon_costs_timestamp ON tryon_costs(timestamp);
CREATE INDEX IF NOT EXISTS idx_tryon_costs_brand ON tryon_costs(brand_id);
CREATE INDEX IF NOT EXISTS idx_tryon_costs_model ON tryon_costs(model);
