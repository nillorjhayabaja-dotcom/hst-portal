-- Database Enhancement for Complete Gate In / Gate Out Lifecycle
-- Migration: add_gate_lifecycle_fields
-- Date: 2025-01-20

-- Add release status enum type (matching Prisma schema naming)
DO $$ BEGIN
  CREATE TYPE "ReleaseStatus" AS ENUM ('pending', 'released', 'returned', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add gate status enum type (matching Prisma schema naming)
DO $$ BEGIN
  CREATE TYPE "GateStatus" AS ENUM ('inside', 'outside');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Note: Old lowercase enums (release_status, gate_status) may still exist in DB
-- but they are not dropped to avoid dependency conflicts. New PascalCase enums
-- (ReleaseStatus, GateStatus) are used by the Prisma schema instead.

-- Add new fields to GatePass table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'gate_status'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN gate_status "GateStatus" DEFAULT 'inside';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'ob_meal_eligible'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN ob_meal_eligible BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'driver_in'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN driver_in TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'trip_duration_minutes'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN trip_duration_minutes INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'returned_by'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN returned_by TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'returned_at'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN returned_at TIMESTAMP(3);
  END IF;
END $$;

-- Add release_status to GatePass if not exists (as enum matching Prisma schema)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'release_status'
  ) THEN
    ALTER TABLE gate_passes ADD COLUMN release_status "ReleaseStatus" DEFAULT 'pending';
  END IF;
END $$;

-- Add new fields to GatePassVerification table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'driver_in'
  ) THEN
    ALTER TABLE gate_pass_verifications ADD COLUMN driver_in TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'ob_meal_eligible'
  ) THEN
    ALTER TABLE gate_pass_verifications ADD COLUMN ob_meal_eligible BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'trip_duration_minutes'
  ) THEN
    ALTER TABLE gate_pass_verifications ADD COLUMN trip_duration_minutes INTEGER;
  END IF;
END $$;

-- Add release_status to GatePassVerification if not exists (as enum matching Prisma schema)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'release_status'
  ) THEN
    ALTER TABLE gate_pass_verifications ADD COLUMN release_status "ReleaseStatus" DEFAULT 'pending';
  END IF;
END $$;

-- Create indexes for better query performance (skip if already exist)
CREATE INDEX IF NOT EXISTS idx_gate_passes_gate_status ON gate_passes(gate_status);
CREATE INDEX IF NOT EXISTS idx_gate_passes_release_status ON gate_passes(release_status);
CREATE INDEX IF NOT EXISTS idx_gate_pass_verifications_release_status ON gate_pass_verifications(release_status);
CREATE INDEX IF NOT EXISTS idx_gate_passes_ob_meal ON gate_passes(ob_meal_enabled, ob_meal_eligible);

-- Update existing records to set default values
UPDATE gate_passes 
SET 
  gate_status = 'inside',
  ob_meal_eligible = false
WHERE gate_status IS NULL;

UPDATE gate_pass_verifications
SET 
  ob_meal_eligible = false
WHERE ob_meal_eligible IS NULL;