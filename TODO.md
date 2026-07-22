# Gate Pass Lifecycle & PDF Finalization - Implementation Plan

## Phase 1: Backend - QR Lifecycle Validation (gate-pass-verification.service.ts)
- [ ] Add `ALREADY_COMPLETED` code for completed/returned gate passes
- [ ] Add `EXPIRED` immediate rejection without DB updates
- [ ] Only increment scan count for valid gate-out scans
- [ ] Return `ALREADY_COMPLETED` without ANY database modifications

## Phase 2: Backend - Verification Controller
- [ ] Handle `ALREADY_COMPLETED` code in controller response
- [ ] Return proper error structure for completed QRs

## Phase 3: Backend - Gate Pass QR Service
- [ ] Add lifecycle validation for completed/expired QRs

## Phase 4: Backend - Gate Pass DTO Updates
- [ ] Already done - verify mapper includes all lifecycle fields
- [ ] Ensure releasedBy uses full name not UUID
- [ ] Ensure completedBy uses full name not UUID

## Phase 5: Backend - PDF Service Updates
- [ ] Already done - verify security names replace UUIDs
- [ ] Verify Released By shows "Juan Dela Cruz, Security Guard" not UUID
- [ ] Verify Verified By shows security name not UUID
- [ ] Verify Request ID is hidden, Control Number shown
- [ ] Verify Arrival is auto-generated from timeIn

## Phase 6: Frontend - SecurityQRScannerModal
- [ ] Already partially done - verify all new states work
- [ ] ALREADY_COMPLETED handling - "This Gate Pass has already been completed."
- [ ] EXPIRED handling - "QR CODE EXPIRED"
- [ ] No database updates on completed scans

## Phase 7: Frontend - GuardPortal
- [ ] Admin table: Remove "Status" column
- [ ] Display: Workflow Status, Released Date/Time, Arrival Date/Time
- [ ] Display: Completed By, OB Meal, Trip Duration
- [ ] Use full names not UUIDs for security personnel

## Phase 8: Frontend - gate-pass-api.ts
- [ ] Verify API types match backend response
- [ ] Handle ALREADY_COMPLETED in response parsing

## Phase 9: Frontend - verify.$token.tsx
- [ ] Handle completed QR display
- [ ] Show proper messages for expired/completed QRs

## Phase 10: Database - Migration (if PostgreSQL is running)
- [ ] Run `npx prisma migrate dev --name add_gate_lifecycle_fields`
- [ ] Regenerate Prisma client

