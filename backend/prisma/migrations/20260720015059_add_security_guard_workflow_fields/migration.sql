-- DropForeignKey
ALTER TABLE "gate_pass_timeline" DROP CONSTRAINT "gate_pass_timeline_actor_id_fkey";

-- DropForeignKey
ALTER TABLE "gate_pass_timeline" DROP CONSTRAINT "gate_pass_timeline_gate_pass_id_fkey";

-- AlterTable
ALTER TABLE "gate_pass_timeline" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "event_type" SET DATA TYPE TEXT,
ALTER COLUMN "event_timestamp" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "actor_name" SET DATA TYPE TEXT,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'driver_name'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "driver_name" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'km_reading_end'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "km_reading_end" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'km_reading_start'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "km_reading_start" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'release_status'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "release_status" TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'return_remarks'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "return_remarks" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'security_remarks'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "security_remarks" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'time_in'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "time_in" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'time_out'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "time_out" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'transportation_type'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "transportation_type" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'vehicle_plate'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "vehicle_plate" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_pass_verifications' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE "gate_pass_verifications" ADD COLUMN "verification_status" TEXT DEFAULT 'pending';
  END IF;
END $$;

-- AlterTable
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'driver_name_security'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "driver_name_security" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'km_reading_end'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "km_reading_end" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'km_reading_start'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "km_reading_start" DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'release_status'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "release_status" TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'released_at'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "released_at" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'released_by'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "released_by" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'released_date'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "released_date" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'released_time'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "released_time" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'return_remarks'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "return_remarks" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'security_remarks'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "security_remarks" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'time_in'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "time_in" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'time_out'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "time_out" TIMESTAMP(3);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'transportation_type_security'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "transportation_type_security" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'vehicle_plate'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "vehicle_plate" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'gate_passes' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE "gate_passes" ADD COLUMN "verification_status" TEXT DEFAULT 'pending';
  END IF;
END $$;

-- AddForeignKey
ALTER TABLE "gate_pass_timeline" ADD CONSTRAINT "gate_pass_timeline_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_timeline" ADD CONSTRAINT "gate_pass_timeline_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_timeline_event_type" RENAME TO "gate_pass_timeline_event_type_idx";

-- RenameIndex
ALTER INDEX "idx_timeline_gatepass" RENAME TO "gate_pass_timeline_gate_pass_id_idx";

-- RenameIndex
ALTER INDEX "idx_timeline_timestamp" RENAME TO "gate_pass_timeline_event_timestamp_idx";
