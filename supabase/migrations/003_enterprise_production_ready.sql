-- supabase/migrations/003_enterprise_production_ready.sql
-- Enterprise-level SQL Migration: System-wide Production Readiness Enhancements.
-- This script sets up common enterprise features like a system logging table,
-- and potentially other global configurations for monitoring and auditing.

BEGIN; -- Start a transaction

-- 1. Create a system_logs table for auditing and monitoring
--    This table will store various system events, errors, and operational logs.
CREATE TABLE IF NOT EXISTS public.system_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL, -- e.g., 'prediction_update', 'feature_calculation', 'error', 'cleanup'
    message TEXT NOT NULL, -- Detailed log message
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    details JSONB -- Optional JSONB field for structured log data (e.g., error stack, processed IDs)
);

-- Add index for faster lookup of logs by type and time
CREATE INDEX IF NOT EXISTS idx_system_logs_event_type ON public.system_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs (created_at DESC);

-- 2. Enable Row Level Security (RLS) for system_logs (if needed, typically read-only for most users)
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies for system_logs
-- Allow service_role to insert logs (backend processes)
CREATE POLICY "Allow service role to insert system logs" ON public.system_logs
    FOR INSERT TO service_role WITH CHECK (true);

-- Allow authenticated users to read their own logs (if applicable, or restrict to admin)
-- For system-wide logs, often restricted to 'service_role' or 'anon' for specific views.
-- For now, let's allow service_role to read all logs for monitoring.
CREATE POLICY "Allow service role to read system logs" ON public.system_logs
    FOR SELECT TO service_role USING (true);

-- 3. Create a generic function for updating 'updated_at' columns (if not already in 001)
--    This function is designed to be reused across multiple tables.
--    It's included here for completeness, but 001_create_matches_table.sql already defines it.
--    If this script is run after 001, this will simply replace the existing function with itself.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execution permissions for the update_updated_at_column function
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO public; -- Public can execute this trigger function

COMMIT; -- End the transaction

-- Verification (for development/testing)
SELECT 'Enterprise production readiness features deployed successfully!' AS status;
SELECT * FROM public.system_logs LIMIT 0; -- Show schema
