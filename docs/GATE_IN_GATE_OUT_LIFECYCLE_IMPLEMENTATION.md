# Gate In / Gate Out Lifecycle Implementation

## Overview

This document describes the complete redesign of the Security Guard Release workflow into a comprehensive Gate In / Gate Out lifecycle management system.

## Database Changes

### Migration File
- **Location**: `backend/prisma/migrations/20260720000001_add_gate_lifecycle_fields/migration.sql`
- **Status**: Ready for deployment

### New Enums
```sql
CREATE TYPE release_status AS ENUM ('pending', 'released', 'returned', 'completed');
CREATE TYPE gate_status AS ENUM ('inside', 'outside');
```

### New Fields Added

#### GatePass Table
- `gate_status` (GateStatus) - Tracks if employee is inside or outside
- `ob_meal_eligible` (Boolean) - Whether OB meal allowance applies
- `driver_in` (String) - Driver name on return
- `trip_duration_minutes` (Integer) - Trip duration in minutes
- `returned_by` (String) - Security guard who processed return
- `returned_at` (DateTime) - Timestamp of return
- `release_status` (ReleaseStatus) - Enum: pending, released, returned, completed

#### GatePassVerification Table
- `driver_in` (String) - Driver name on return
- `ob_meal_eligible` (Boolean) - Whether OB meal allowance applies
- `trip_duration_minutes` (Integer) - Trip duration in minutes
- `release_status` (ReleaseStatus) - Enum: pending, released, returned

### Indexes Created
```sql
CREATE INDEX idx_gate_passes_gate_status ON gate_passes(gate_status);
CREATE INDEX idx_gate_passes_release_status ON gate_passes(release_status);
CREATE INDEX idx_gate_passes_ob_meal ON gate_passes(ob_meal_enabled, ob_meal_eligible);
```

## Complete Workflow

### 1. Employee Creates Gate Pass
- Employee fills out gate pass form
- Submits for approval
- **Status**: `draft` → `pending`

### 2. Approval Completed
- Sequential workflow approval process
- All required approvers sign off
- **Status**: `approved`
- **Action**: QR code generation triggered

### 3. QR Generated
- Secure verification token created (32-byte random hex)
- QR code image generated (PNG base64)
- Token stored in `gate_pass_verifications` table
- **Status**: `qr_generated`
- **Notifications**: Employee and security team notified

### 4. Security Scans QR
- **Automatic Mode Detection**:
  - IF `releaseStatus == 'released'` → **GATE IN MODE**
  - ELSE → **GATE OUT MODE**
- System decides automatically - no manual selection needed
- **Status**: `verified`

### 5. Gate Out Form (First Scan)
Security inputs:
- **KM Reading Out** (number only, required)
- **Plate Number** (editable, optional)
- **Driver** (editable, optional)
- **Release Remarks** (text, optional)

**Automatic Fields**:
- Released Time (current timestamp)
- Released By (security user)
- Security Account (user ID)
- Security Guard Name (from employee record)
- Gate (location)
- Audit Log entry

**Validation**:
- KM Reading Out must be >= 0

**Actions**:
1. Update `gate_pass_verifications`:
   - `status` = 'released'
   - `releaseStatus` = 'released'
   - `kmReadingStart` = input value
   - `timeOut` = current timestamp
   - `releasedAt` = current timestamp
   - `releasedBy` = security user ID
   - `guardEmployeeId` = security employee ID
   - `guardIPAddress` = client IP
   - `guardDevice` = device info
   - `guardBrowser` = browser info

2. Update `gate_passes`:
   - `releaseStatus` = 'released'
   - `gateStatus` = 'outside'
   - `kmReadingStart` = input value
   - `timeOut` = current timestamp
   - `releasedAt` = current timestamp
   - `releasedBy` = security user name
   - `securityReleasedBy` = security user ID
   - `securityReleasedAt` = current timestamp
   - `isUsed` = true
   - `isVerified` = true

3. Update `approval_requests`:
   - `status` = 'approved' (NOT completed yet)
   - `completedAt` = null

4. Create `approval_actions`:
   - `action` = 'release'
   - `actorId` = security user ID
   - `metadata` = full release details

5. Create `audit_logs`:
   - `action` = 'release'
   - Complete metadata with all security details

6. Create `gate_pass_timeline`:
   - `eventType` = 'released'
   - Full description and metadata

7. Send Notifications:
   - Requester: "Gate Pass Released"
   - Supervisor: "Gate Pass Successfully Completed"
   - Admin: "Gate Pass Successfully Completed"

**Result**: Employee exits company premises

### 6. Employee Returns
Employee returns to company premises

### 7. Security Scans Same QR Again
- System detects `releaseStatus == 'released'`
- **Automatically switches to GATE IN MODE**
- **Message**: "Employee returning. Please complete the Gate In form."

### 8. Gate In Form (Second Scan)
**Automatically Displayed**:
- Previous Time Out
- Previous KM Out
- Previous Driver
- Requester information
- Department
- Destination
- Vehicle details

Security only inputs:
- **KM Reading In** (number only, required)
- **Remarks** (text, optional)

**Automatic Fields**:
- Time In (current timestamp)
- Returned By (security user)
- Security User (user ID)

**Validation**:
- **KM In cannot be lower than KM Out**
- If validation fails, return error: `INVALID_KM_READING`

**Actions**:
1. Calculate Trip Duration:
   ```javascript
   tripDurationMs = timeIn - timeOut
   tripDurationHours = tripDurationMs / (1000 * 60 * 60)
   tripDurationMinutes = Math.floor(tripDurationMs / (1000 * 60))
   ```

2. Check CALABARZON Logic:
   ```javascript
   calabarzonProvinces = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon']
   isOutsideCalabarzon = !destination.includes(any province)
   ```

3. Check OB Meal Eligibility:
   ```javascript
   obMealThresholdHours = parseFloat(process.env.OB_MEAL_THRESHOLD_HOURS || '4')
   isEligibleForOBMeal = isOutsideCalabarzon && tripDurationHours >= obMealThresholdHours
   ```

4. Update `gate_pass_verifications`:
   - `status` = 'returned'
   - `releaseStatus` = 'returned'
   - `timeIn` = current timestamp
   - `kmReadingEnd` = input value
   - `obMealEligible` = calculated eligibility
   - `tripDurationMinutes` = calculated minutes

5. Update `gate_passes`:
   - `releaseStatus` = 'returned'
   - `gateStatus` = 'inside'
   - `timeIn` = current timestamp
   - `kmReadingEnd` = input value
   - `tripDuration` = calculated hours
   - `tripDurationMinutes` = calculated minutes
   - `returnedBy` = security user name
   - `returnedAt` = current timestamp
   - `approvalStage` = 'completed'
   - `completedAt` = current timestamp
   - `obMealEnabled` = eligibility result
   - `obMealEligible` = eligibility result
   - `obMealAmount` = amount if eligible, else 0

6. Update `approval_requests`:
   - `status` = 'completed'
   - `completedAt` = current timestamp

7. Create `approval_actions`:
   - `action` = 'return'
   - Full metadata with trip details

8. Create `audit_logs`:
   - `action` = 'return'
   - Complete metadata

9. Create `gate_pass_timeline`:
   - `eventType` = 'completed'
   - Full description with trip duration

10. Send Notifications:
    - Requester: "Gate Pass Returned"
    - Supervisor: "Gate Pass Successfully Completed"
    - Admin: "Gate Pass Successfully Completed"
    - **HR** (if OB Meal eligible): "OB Meal Allowance Required"

**Result**: 
- Employee successfully returned
- Workflow completed
- Available for HR export
- Accounting receives OB Meal report

## Business Rules

### CALABARZON Configuration
**Default Provinces**:
- Cavite
- Laguna
- Batangas
- Rizal
- Quezon

**Logic**: If destination is NOT in CALABARZON list, consider it "outside"

### OB Meal Allowance Configuration
**Environment Variables**:
- `OB_MEAL_THRESHOLD_HOURS` (default: 4 hours)
- `OB_MEAL_DEFAULT_AMOUNT` (default: ₱500)

**Eligibility Criteria**:
1. Destination is outside CALABARZON
2. Trip duration >= threshold hours (default: 4 hours)

**Both conditions must be true** for OB Meal to be required.

### KM Validation
- **Rule**: KM Reading In cannot be lower than KM Reading Out
- **Error Code**: `INVALID_KM_READING`
- **Error Message**: "KM Reading In (X) cannot be lower than KM Reading Out (Y)"

## Security Features

### Automatic Mode Detection
System automatically determines Gate Out vs Gate In:
```javascript
if (releaseStatus === 'released') {
  mode = 'gate_in';
} else {
  mode = 'gate_out';
}
```

### Duplicate Scan Prevention
- Database transactions ensure atomic updates
- Row-level locking prevents double-release
- Status checks before every state transition

### Security Snapshot
When releasing/returning, save:
- `releasedByUserId` / `returnedByUserId`
- `releasedByName` / `returnedByName` (snapshot)
- `guardEmployeeId`
- `guardEmployeeNumber`
- `guardIPAddress`
- `guardDevice`
- `guardBrowser`

This preserves historical records even if security guard later changes name or leaves company.

## Audit Trail

### Complete Audit Log
Every action is logged with:
- Timestamp
- Security User (ID and name)
- IP Address
- Browser/Device info
- All field changes
- Metadata

### Timeline Events
- `qr_generated` - QR code created
- `released` - Employee exited (Gate Out)
- `completed` - Employee returned (Gate In)
- Each event includes full metadata

## Notifications

### Gate Out Notifications
1. **Requester**: "Gate Pass Released" - Please return by [expected return time]
2. **Supervisor**: "Gate Pass Successfully Completed"
3. **Admin**: "Gate Pass Successfully Completed"

### Gate In Notifications
1. **Requester**: "Gate Pass Returned" - Trip duration: X hours
2. **Supervisor**: "Gate Pass Successfully Completed" - Employee returned
3. **Admin**: "Gate Pass Successfully Completed" - Gate pass returned by security
4. **HR** (if OB Meal): "OB Meal Allowance Required" - Amount: ₱X

## API Endpoints

### Verify Token (Public)
```
GET /api/v1/verify/:token
```
Returns gate pass details with mode indicator (`gate_out` or `gate_in`)

### Release Gate Pass (Authenticated - Security)
```
POST /api/v1/verify/:token/release
Body: {
  kmReadingStart: number,
  kmReadingEnd?: number,
  plateNumber?: string,
  driverName?: string,
  remarks?: string
}
```

### Process Return (Authenticated - Security)
```
POST /api/v1/verify/:token/return
Body: {
  kmReadingEnd: number,
  returnRemarks?: string,
  obMealEnabled?: boolean,
  obMealAmount?: number
}
```

### Get Status (Public)
```
GET /api/v1/verify/:token/status
```

### Cancel Verification (Admin)
```
POST /api/v1/verify/:token/cancel
Body: { reason: string }
```

## Frontend Integration

### Security QR Scanner Modal
- Scans QR code
- Calls `validateVerificationToken`
- Receives `mode` indicator
- Displays appropriate form (Gate Out or Gate In)

### Gate Out Form
Shows when `mode === 'gate_out'`:
- KM Reading Out (number input)
- Plate Number (text input)
- Driver (text input)
- Release Remarks (textarea)
- Submit button: "Release Employee"

### Gate In Form
Shows when `mode === 'gate_in'`:
- **Read-only display**:
  - Time Out
  - KM Out
  - Driver Out
  - Plate Number
  - Requester
  - Department
  - Destination
- **Input fields**:
  - KM Reading In (number input)
  - Remarks (textarea)
- Submit button: "Process Return"

### OB Meal Field
Conditionally displayed when:
- `obMealEligible === true`
- Security can edit amount (default from environment config)

## Admin Table Updates

### Columns to Display
- Workflow (status)
- Requester
- Department
- Purpose
- Destination
- Released By
- Released Date
- Released Time
- Returned By
- Returned Date
- Returned Time
- Trip Duration (readable format: "5 Hours 32 Minutes")
- KM Out
- KM In
- OB Meal (amount if applicable)
- Export Ready (boolean)

### Real-time Refresh
- After Release: Refresh table
- After Return: Refresh table
- After Completion: Refresh table
- Use WebSocket if available, otherwise invalidate cache

## HR Export

### Export Fields
- Control Number
- Employee Name
- Department
- Purpose
- Destination
- Released By
- Released Date
- Released Time
- Returned By
- Returned Date
- Returned Time
- KM Out
- KM In
- Driver
- Plate Number
- Trip Duration (hours and minutes)
- OB Meal Allowance
- Workflow Status

### Format
- Excel (.xlsx)
- Accounting-ready
- Includes OB Meal calculations

## Backward Compatibility

### Existing Data
- All existing gate passes remain functional
- New fields have default values
- Old `releaseStatus` string values converted to enum
- No data loss during migration

### Legacy Support
- Old QR codes still work
- Existing approval flow unchanged
- Timeline service backward compatible
- Audit logs continue to work

## Testing Checklist

- [ ] Employee creates gate pass
- [ ] Approval workflow completes
- [ ] QR code generated
- [ ] Security scans QR (first time) → Gate Out form
- [ ] Security fills KM Out and releases
- [ ] Employee exits
- [ ] Security scans same QR (second time) → Gate In form
- [ ] System displays previous Time Out and KM Out
- [ ] Security enters KM In
- [ ] KM validation works (rejects if KM In < KM Out)
- [ ] Trip duration calculated correctly
- [ ] CALABARZON logic works
- [ ] OB Meal eligibility calculated correctly
- [ ] HR notified if OB Meal required
- [ ] Timeline events created
- [ ] Audit logs created
- [ ] Notifications sent
- [ ] Admin table refreshes
- [ ] HR export includes all fields
- [ ] Duplicate scan prevented
- [ ] Backward compatibility maintained

## Deployment Steps

1. **Backup Database**
   ```bash
   pg_dump -U postgres hst_portal > backup_before_gate_lifecycle.sql
   ```

2. **Run Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_gate_lifecycle_fields
   ```

3. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Deploy Backend**
   ```bash
   npm run build
   pm2 restart ecosystem.config.cjs
   ```

5. **Verify Deployment**
   - Check database tables created
   - Test QR scanning
   - Test Gate Out flow
   - Test Gate In flow
   - Verify notifications

## Rollback Plan

If issues occur:
1. Restore database backup
2. Revert code changes
3. Restart services

## Support

For issues or questions:
- Check audit logs for detailed error tracking
- Review timeline events for workflow state
- Monitor notification delivery
- Verify database constraints

## Version History

- **v1.0** (2025-01-20): Initial implementation of complete Gate In / Gate Out lifecycle