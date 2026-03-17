CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS platforms (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    base_url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS markets (
    id SERIAL PRIMARY KEY,
    platform_id INTEGER NOT NULL REFERENCES platforms(id),
    external_id TEXT NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    image_url TEXT,
    url TEXT,
    outcome_yes_price NUMERIC(10, 4),
    outcome_no_price NUMERIC(10, 4),
    volume NUMERIC(20, 2),
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (platform_id, external_id)
);

CREATE TABLE IF NOT EXISTS price_snapshots (
    id SERIAL PRIMARY KEY,
    market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    yes_price NUMERIC(10, 4) NOT NULL,
    no_price NUMERIC(10, 4) NOT NULL,
    volume NUMERIC(20, 2),
    recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_markets_platform ON markets(platform_id);
CREATE INDEX idx_markets_category ON markets(category_id);
CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_snapshots_market ON price_snapshots(market_id);
CREATE INDEX idx_snapshots_time ON price_snapshots(recorded_at);

INSERT INTO platforms (name, slug, base_url) VALUES
    ('Polymarket', 'polymarket', 'https://polymarket.com'),
    ('Kalshi', 'kalshi', 'https://kalshi.com'),
    ('Manifold', 'manifold', 'https://manifold.markets')
ON CONFLICT DO NOTHING;
