-- Style Sync Database Schema

-- Brands table (multi-tenant)
CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    shopify_domain TEXT,
    api_key TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'trial',
    plan TEXT DEFAULT 'basic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    primary_color TEXT DEFAULT '#4f46e5',
    monthly_try_on_limit INTEGER DEFAULT 1000,
    current_month_usage INTEGER DEFAULT 0
);

-- Garments table
CREATE TABLE garments (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    color TEXT,
    description TEXT,
    shopify_product_id TEXT,
    price REAL,
    currency TEXT DEFAULT 'USD',
    image_url TEXT NOT NULL,
    size_chart TEXT NOT NULL,
    active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX idx_garments_brand ON garments(brand_id);
CREATE INDEX idx_garments_active ON garments(brand_id, active);

-- User sessions
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL,
    original_photo_url TEXT NOT NULL,
    model_photo_url TEXT,
    measurements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX idx_sessions_brand ON user_sessions(brand_id);
