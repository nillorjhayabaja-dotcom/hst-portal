# Security Guard Workflow - Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for the Security Guard Workflow as specified in the HST Enterprise Request Portal System Documentation.

## Current State Analysis

### Existing Implementation
✅ Complete Gate Pass Module
✅ Prisma Database Schema
✅ QR Verification Service
✅ Security Scanner UI
✅ Approval System
✅ Notification System
✅ Audit Logs

### Gaps Identified
⚠️ Missing OB Meal Allowance fields
⚠️ Missing Trip Duration calculation
⚠️ Missing Timeline table
⚠️ Return process not fully implemented
⚠️ Admin dashboard missing required fields

## Implementation Phases

### Phase 1: Database Enhancements
**Objective:** Add missing fields to support complete workflow

#### 1.1 Add OB Meal Fields to GatePass
```prisma
obMealEnabled  Boolean   @default(false) @map("ob_meal_enabled")
obMealAmount   Decimal?  @default(0) @db.Decimal(10, 2) @map("ob_meal_amount")
```

#### 1.2 Add Trip Duration Field
```prisma
tripDuration  Float?   @map("trip_duration")
```

#### 1.3 Create Timeline Table
```prisma
model GatePassTimeline {
  id              String   @id @default(uuid())
  gatePassId      String   @map("gate_pass_id")
  eventType       String   @map("event_type")
  eventTimestamp  DateTime @default(now()) @map("event_timestamp")
  actorId         String?  @map("actor_id")
  actorName       String?  @map("actor_name")
  description     String?
  metadata        Json?
  createdAt       DateTime @default(now()) @map("created_at")

  gatePass        GatePass @relation(fields: [gatePassId], references: [id], onDelete: Cascade)
  actor           User?     @relation(fields: [actorId], references: [id])

  @@index([gatePassId])
  @@index([eventType])
  @@index([eventTimestamp])
  @@map("gate_pass_timeline")
}
```

### Phase 2: Backend Service Enhancements
**Objective:** Implement business logic for return process and OB meal

#### 2.1 Enhance GatePassVerificationService
- Add return processing logic
- Implement trip duration calculation
- Implement OB meal eligibility check
- Add timeline event creation

#### 2.2 Enhance GatePassService
- Add return API endpoint
- Add trip duration calculation
- Add OB meal logic

#### 2.3 Create GatePassTimelineService
- Timeline event creation
- Timeline retrieval
- Timeline aggregation

### Phase 3: API Enhancements
**Objective:** Extend existing APIs without breaking changes

#### 3.1 Add Return Endpoint
```
POST /api/v1/verify/:token/return
```

#### 3.2 Enhance Verification Response
Add return mode detection

### Phase 4: Frontend Enhancements
**Objective:** Implement UI for return process and OB meal

#### 4.1 Enhance SecurityQRScannerModal
- Add return mode detection
- Add KM In input
- Add OB meal allowance checkbox
- Add trip duration display

#### 4.2 Enhance GuardPortal
- Add return form
- Add OB meal display
- Add trip duration display

### Phase 5: Admin Dashboard
**Objective:** Display required fields in admin table

#### 5.1 Update Admin Gate Pass Table
- Control Number
- Employee
- Department
- Purpose
- Destination
- Released By
- Released Date
- Released Time
- Returned Time
- Trip Duration
- OB Meal Allowance
- Workflow Status

### Phase 6: Testing & Validation
**Objective:** Ensure complete workflow functionality

#### 6.1 Unit Tests
- Trip duration calculation
- OB meal eligibility logic
- Timeline creation

#### 6.2 Integration Tests
- Complete exit process
- Complete return process
- OB meal business rules

#### 6.3 E2E Tests
- Full workflow from creation to completion

## Risk Assessment

### Low Risk
- Database schema changes (non-breaking)
- API extensions (backward compatible)

### Medium Risk
- Timeline table creation (new feature)
- OB meal logic (business rule implementation)

### High Risk
- Return process implementation (critical workflow)
- Admin dashboard changes (UI impact)

## Rollback Plan

### Database Rollback
```bash
# Rollback migration
cd backend && npx prisma migrate dev --name rollback_ob_meal
```

### Code Rollback
- Git revert to previous commit
- Deploy previous version

## Success Criteria

✅ All database enhancements implemented
✅ Security Guard Exit Process functional
✅ Employee Return Process functional
✅ OB Meal Allowance logic working
✅ Admin Dashboard displaying correct data
✅ All tests passing
✅ No breaking changes to existing APIs
✅ Complete audit trail for all actions

## Timeline Estimate

- Phase 1 (Database): 2 hours
- Phase 2 (Backend): 4 hours
- Phase 3 (API): 2 hours
- Phase 4 (Frontend): 4 hours
- Phase 5 (Admin): 2 hours
- Phase 6 (Testing): 4 hours

**Total:** 18 hours

## Next Steps

1. Get approval for implementation plan
2. Start with Phase 1: Database Enhancements
3. Proceed sequentially through each phase
4. Test after each phase
5. Deploy to production after validation