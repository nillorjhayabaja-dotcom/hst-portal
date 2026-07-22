# Security Gate Pass Module Enhancement

## Implementation Checklist

### 1. Database Schema (Prisma)
- [x] Already exists: `returnedAt`, `tripDurationMinutes`, `obMealEligible`, `obMealAmount`, `releasedBy` fields in GatePass model
- [ ] Add `employeeReturn` computed/virtual field logic for Security and Admin tables

### 2. Backend - Repository Layer
- [ ] Update `gate-pass.repository.ts` to include `releasedBy` (display name) and `returnedAt` in selection
- [ ] Ensure User join for `releasedBy` to return both `releasedById` (UUID) and `releasedByName` (displayName)

### 3. Backend - Service Layer
- [x] Already implemented: OB Meal eligibility logic in `gate-pass-verification.service.ts`
- [x] Already implemented: Trip duration calculation in `processReturn`
- [ ] Update `releaseGatePass` to ensure `releasedBy` stores the security guard's display name
- [ ] Add employee return auto-timestamp when QR scanned in Return Mode (already done in `processReturn`)

### 4. Backend - DTO Layer
- [ ] Update `mapGatePassToListItem` to return `releasedByName` instead of UUID for `releasedBy`
- [ ] Add `employeeReturn` and `tripDuration` display fields to DTO

### 5. Backend - Export Service
- [ ] Remove PDF/Print export options - keep only Excel
- [ ] Create Excel export with exact columns: Requester, Department, Purpose, Destination, Workflow Status, Release Date, Release Time, Employee Return, Trip Duration, Released By, OB Meal Eligible, OB Meal Amount

### 6. Frontend - GatePassModule Columns
- [ ] Replace `securityReleasedBy` column with `releasedBy` showing Security Guard Name
- [ ] Add `employeeReturn` column after Release Time
- [ ] Add `tripDuration` column after Employee Return
- [ ] Remove Export dropdown, replace with single Export Excel button

### 7. Frontend - GuardPortal
- [ ] Update display of Released By to show guard name instead of UUID
- [ ] Add Employee Return and Trip Duration display

### 8. Frontend - SecurityQRScannerModal
- [ ] Add Employee Return auto-recording on QR scan in Return Mode

### 9. Audit Trail Enhancement
- [ ] Ensure every action is logged: QR Released, QR Returned, Completed

### 10. Verification Routes
- [ ] Add Excel export endpoint