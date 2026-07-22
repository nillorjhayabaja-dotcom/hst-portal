-- Database Enhancement for Security Guard Workflow
-- Migration: add_security_guard_workflow_fields
-- Date: 2025-01-20

-- Add OB Meal Allowance fields to GatePass table
ALTER TABLE gate_passes 
  ADD COLUMN ob_meal_enabled BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN ob_meal_amount DECIMAL(10,2) DEFAULT 0;

-- Add Trip Duration field to GatePass table
ALTER TABLE gate_passes 
  ADD COLUMN trip_duration FLOAT;

-- Create GatePassTimeline table for comprehensive audit trail
CREATE TABLE gate_pass_timeline (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gate_pass_id TEXT NOT NULL REFERENCES gate_passes(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  actor_id TEXT REFERENCES users(id),
  actor_name VARCHAR(255),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for GatePassTimeline
CREATE INDEX idx_timeline_gatepass ON gate_pass_timeline(gate_pass_id);
CREATE INDEX idx_timeline_event_type ON gate_pass_timeline(event_type);
CREATE INDEX idx_timeline_timestamp ON gate_pass_timeline(event_timestamp);

-- Add check constraints
ALTER TABLE gate_passes 
  ADD CONSTRAINT ob_meal_amount_check 
  CHECK (ob_meal_amount >= 0);

ALTER TABLE gate_passes 
  ADD CONSTRAINT trip_duration_check 
  CHECK (trip_duration >= 0);