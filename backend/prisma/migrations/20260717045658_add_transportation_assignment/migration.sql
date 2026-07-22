-- CreateTable
CREATE TABLE "transportation_assignments" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "transportation_type" TEXT NOT NULL,
    "vehicle_plate" TEXT,
    "driver_name" TEXT,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transportation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_trip_logs" (
    "id" TEXT NOT NULL,
    "gate_pass_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "km_start" DOUBLE PRECISION,
    "km_end" DOUBLE PRECISION,
    "time_out" TIMESTAMP(3),
    "time_in" TIMESTAMP(3),
    "checked_by" TEXT NOT NULL,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_trip_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transportation_assignments_gate_pass_id_key" ON "transportation_assignments"("gate_pass_id");

-- CreateIndex
CREATE INDEX "transportation_assignments_gate_pass_id_idx" ON "transportation_assignments"("gate_pass_id");

-- CreateIndex
CREATE INDEX "transportation_assignments_vehicle_id_idx" ON "transportation_assignments"("vehicle_id");

-- CreateIndex
CREATE INDEX "security_trip_logs_gate_pass_id_idx" ON "security_trip_logs"("gate_pass_id");

-- CreateIndex
CREATE INDEX "security_trip_logs_vehicle_id_idx" ON "security_trip_logs"("vehicle_id");

-- AddForeignKey
ALTER TABLE "transportation_assignments" ADD CONSTRAINT "transportation_assignments_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transportation_assignments" ADD CONSTRAINT "transportation_assignments_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_trip_logs" ADD CONSTRAINT "security_trip_logs_gate_pass_id_fkey" FOREIGN KEY ("gate_pass_id") REFERENCES "gate_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_trip_logs" ADD CONSTRAINT "security_trip_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
