-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT,
ADD COLUMN     "is_online" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "online_status" TEXT NOT NULL DEFAULT 'offline',
ADD COLUMN     "password_expires_at" TIMESTAMP(3),
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by" TEXT,
ADD COLUMN     "suspended_reason" TEXT,
ADD COLUMN     "unlock_at" TIMESTAMP(3),
ADD COLUMN     "unlock_reason" TEXT;
