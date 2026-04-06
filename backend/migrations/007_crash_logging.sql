-- Migration: crash_logging
-- Creates table for storing frontend and backend crash reports

CREATE TABLE IF NOT EXISTS crash_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crash_type VARCHAR(20) NOT NULL CHECK (crash_type IN ('frontend', 'backend')),
  severity VARCHAR(20) NOT NULL DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  stack_trace TEXT,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  user_agent TEXT,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  fingerprint VARCHAR(64),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crash_logs_type ON crash_logs(crash_type);
CREATE INDEX IF NOT EXISTS idx_crash_logs_fingerprint ON crash_logs(fingerprint);
CREATE INDEX IF NOT EXISTS idx_crash_logs_resolved ON crash_logs(resolved);
CREATE INDEX IF NOT EXISTS idx_crash_logs_created ON crash_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_logs_user ON crash_logs(user_id);