-- CreateTable
CREATE TABLE "gate_pass_verifications" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "verification_token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'generated',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "scanned_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "released_by" TEXT,
    "scan_count" INTEGER NOT NULL DEFAULT 0,
    "guard_employee_id" TEXT,
    "guard_ip_address" TEXT,
    "guard_device" TEXT,
    "guard_browser" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_pass_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gate_pass_verifications_verification_token_key" ON "gate_pass_verifications"("verification_token");

-- CreateIndex
CREATE INDEX "gate_pass_verifications_verification_token_idx" ON "gate_pass_verifications"("verification_token");

-- CreateIndex
CREATE INDEX "gate_pass_verifications_gate_pass_id_idx" ON "gate_pass_verifications"("gate_pass_id");

-- CreateIndex
CREATE INDEX "gate_pass_verifications_status_idx" ON "gate_pass_verifications"("status");

-- AddForeignKey
ALTER TABLE "gate_pass_verifications" ADD CONSTRAINT "gate_pass_verifications_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
