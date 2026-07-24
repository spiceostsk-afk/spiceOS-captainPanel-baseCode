-- Database migration to support Shift Reports in Captain Panel
-- Run this script once in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shift_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  captain_name TEXT NOT NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  total_tables_served INTEGER NOT NULL,
  total_orders INTEGER NOT NULL,
  total_revenue NUMERIC(10, 2) NOT NULL,
  total_waiter_calls INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE shift_reports ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for insertions (if you do not require authenticated sessions for writing reports)
CREATE POLICY "Allow anonymous insert on shift_reports" ON shift_reports FOR INSERT WITH CHECK (true);

-- Allow anonymous access for selection (if you want your admin panel to read them without strict auth constraints, or adjust as needed)
CREATE POLICY "Allow anonymous select on shift_reports" ON shift_reports FOR SELECT USING (true);
