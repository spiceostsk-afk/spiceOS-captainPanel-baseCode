-- Database migration v2 — supports table transfer/merge, KOT cancellation,
-- per-item notes, bill discount, and shift-report breakdown.
-- Run this script once in your Supabase SQL Editor, after database_migration.sql.
-- All statements are additive (IF NOT EXISTS) and safe to re-run.

-- Table transfer / merge ---------------------------------------------------
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS merged_into UUID REFERENCES restaurant_tables(id);

-- Billing: discount applied at "Mark Billing" time -------------------------
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS bill_discount_type TEXT;
ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS bill_discount_value NUMERIC(10, 2) DEFAULT 0;

-- Customer phone number on the session (assignTable already writes this;
-- this just guarantees the column exists so it can be read back) ---------
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Assigned waiter/server name on the session (the dashboard's table query
-- selects this column explicitly, so it must exist or the whole query fails) --
ALTER TABLE customer_sessions ADD COLUMN IF NOT EXISTS server_name TEXT;

-- Per-item special instructions --------------------------------------------
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- KOT item cancellation ------------------------------------------------------
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Shift report per-table revenue/order breakdown ----------------------------
ALTER TABLE shift_reports ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '[]'::jsonb;
