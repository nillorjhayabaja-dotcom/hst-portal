-- AlterTable
ALTER TABLE "users" ADD COLUMN     "signature_mime_type" TEXT,
ADD COLUMN     "signature_path" TEXT,
ADD COLUMN     "signature_uploaded_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "qr_scan_logs" (
    "id" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "request_id" TEXT,
    "scanned_by" TEXT NOT NULL,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "action" TEXT,
    "metadata" JSONB,

    CONSTRAINT "qr_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qr_scan_logs_qr_code_idx" ON "qr_scan_logs"("qr_code");

-- CreateIndex
CREATE INDEX "qr_scan_logs_request_id_idx" ON "qr_scan_logs"("request_id");

-- AddForeignKey
ALTER TABLE "qr_scan_logs" ADD CONSTRAINT "qr_scan_logs_scanned_by_fkey" FOREIGN KEY ("scanned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
