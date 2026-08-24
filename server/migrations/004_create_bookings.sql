-- 004_create_bookings.sql

-- Ensure btree_gist is available for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  period tstzrange GENERATED ALWAYS AS (tstzrange(start_date, end_date, '[)')) STORED,
  status TEXT NOT NULL DEFAULT 'pending',
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_property_period ON bookings USING GIST (property_id, period);

-- Exclude overlapping bookings for active statuses
ALTER TABLE bookings
  ADD CONSTRAINT IF NOT EXISTS no_overlapping_bookings EXCLUDE USING gist (
    property_id WITH =,
    period WITH &&
  ) WHERE (status IN ('pending','confirmed','paid'));
