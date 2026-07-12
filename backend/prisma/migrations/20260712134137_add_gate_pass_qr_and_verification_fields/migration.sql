/*
  Warnings:

  - A unique constraint covering the columns `[qr_token]` on the table `gate_passes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "gate_passes" ADD COLUMN     "approval_stage" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" TEXT,
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "is_used" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noted_at" TIMESTAMP(3),
ADD COLUMN     "noted_by" TEXT,
ADD COLUMN     "qr_generated_at" TIMESTAMP(3),
ADD COLUMN     "qr_token" TEXT,
ADD COLUMN     "recommended_at" TIMESTAMP(3),
ADD COLUMN     "recommended_by" TEXT,
ADD COLUMN     "verified_at" TIMESTAMP(3),
ADD COLUMN     "verified_by" TEXT;

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "verified_by" TEXT NOT NULL,
    "guard_id" TEXT NOT NULL,
    "scan_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "ip_address" TEXT,
    "device" TEXT,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verifications_gate_pass_id_idx" ON "verifications"("gate_pass_id");

-- CreateIndex
CREATE UNIQUE INDEX "gate_passes_qr_token_key" ON "gate_passes"("qr_token");

-- CreateIndex
CREATE INDEX "gate_passes_qr_token_idx" ON "gate_passes"("qr_token");

-- CreateIndex
CREATE INDEX "gate_passes_approval_stage_idx" ON "gate_passes"("approval_stage");

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "qr_scan_logs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "gate_passes"("request_id") ON DELETE SET NULL ON UPDATE CASCADE;
