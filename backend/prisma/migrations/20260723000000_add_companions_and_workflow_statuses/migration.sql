-- Create gate_pass_companions table
-- Note: Using TEXT for FK columns to match the parent tables which use TEXT (Prisma String maps to TEXT)
CREATE TABLE IF NOT EXISTS "gate_pass_companions" (
    "id" TEXT PRIMARY KEY,
    "gate_pass_id" TEXT NOT NULL REFERENCES "gate_passes"("id") ON DELETE CASCADE,
    "employee_id" TEXT REFERENCES "employees"("id") ON DELETE SET NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "created_by" TEXT REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_gate_pass_companions_gate_pass_id ON "gate_pass_companions"("gate_pass_id");
CREATE INDEX IF NOT EXISTS idx_gate_pass_companions_employee_id ON "gate_pass_companions"("employee_id");

-- Add new status values to approval_requests if not already present
-- We'll handle this via application logic rather than enum modifications