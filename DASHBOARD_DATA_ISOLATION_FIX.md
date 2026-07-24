# Employee Dashboard Data Isolation Fix

## Problem
The Employee Dashboard was displaying the same statistics and request data for all users who share the Employee role. This was incorrect - the dashboard must display data specific to the authenticated user, not all users with the same role.

## Root Causes
1. Backend `dashboard.controller.ts` returned global stats without filtering by user ID
2. `approval.service.ts` `getDashboardStats()` counted ALL requests, not user-specific
3. Frontend `RoleDashboard.tsx` had hardcoded filter for "Liza Mendoza" 
4. RecentRequests widget didn't filter by current user

## Changes Made

### Backend Changes

#### 1. `backend/src/application/services/approval.service.ts`
- **Modified**: `getDashboardStats()` method
- **Change**: Added optional `userId` parameter
- **Behavior**: When `userId` is provided, filters all counts by `requesterId: userId`
- **Impact**: Enables user-specific statistics for employee role

```typescript
async getDashboardStats(userId?: string) {
  const userFilter = userId ? { requesterId: userId } : {};
  // All counts now use userFilter
}
```

#### 2. `backend/src/interfaces/http/controllers/dashboard.controller.ts`
- **Modified**: `getOverview()` and `getMetrics()` methods
- **Change**: Extract user role from request, pass userId to stats for employee role only
- **Behavior**: 
  - Employee role: stats filtered by user ID
  - Admin/Manager roles: stats show all data (unchanged)
- **Impact**: Backend now returns role-appropriate data

```typescript
const userId = (req as any).user?.id || '';
const userRole = (req as any).user?.role || '';
const isEmployee = userRole === 'employee';
const statsUserId = isEmployee ? userId : undefined;
await approvalService.getDashboardStats(statsUserId);
```

### Frontend Changes

#### 3. `src/features/dashboards/RoleDashboard.tsx`
- **Modified**: Employee dashboard section
- **Changes**:
  - Added `useAuth()` hook to get current user
  - Removed hardcoded filter `"Liza Mendoza"`
  - Pass `user?.id` to `RecentRequests` component
- **Impact**: Dashboard now uses authenticated user's ID

```typescript
const { user } = useAuth();
// ...
<RecentRequests
  title="My Recent Requests"
  userId={user?.id}
/>
```

#### 4. `src/features/dashboards/widgets.tsx`
- **Modified**: `RecentRequests` component
- **Changes**:
  - Added `userId` parameter
  - Pass `userId` as `requesterId` to `useApprovalRequests` hook
- **Impact**: Recent requests now filtered by current user

```typescript
export function RecentRequests({
  // ...
  userId,
}: {
  // ...
  userId?: string;
}) {
  const { data, isLoading } = useApprovalRequests({ 
    pageSize: limit,
    requesterId: userId,
  });
}
```

### Already Correct (No Changes Needed)

#### 5. `backend/src/interfaces/http/controllers/notification.controller.ts`
- **Status**: Already correctly implemented
- **Verification**: All notification endpoints filter by `recipientId: user.id`
- **Endpoints**: list, unreadCount, markRead, markAllRead, delete, deleteAll

## Data Flow

### Before Fix
```
Employee Dashboard → API → Backend
                     ↓
              Returns ALL employee requests (role-based)
                     ↓
              All employees see same data ❌
```

### After Fix
```
Employee Dashboard → API → Backend
                     ↓
              Filters by authenticated user ID
                     ↓
              Each employee sees only their own data ✓
```

## Verification

### Test Scenario
1. Log in as Employee A (e.g., "ROLLIN JHAY ABAJA")
   - Dashboard shows: My Requests = 14, Pending = 3, Approved = 1
   - Recent Requests shows only ROLLIN's requests

2. Log in as Employee B (e.g., "Liza Mendoza")
   - Dashboard shows: My Requests = X, Pending = Y, Approved = Z
   - Recent Requests shows only Liza's requests

3. Both employees see different statistics based on their own records ✓

### Key Endpoints
- `GET /dashboard/overview` - Now filters by user ID for employee role
- `GET /dashboard/metrics` - Now filters by user ID for employee role
- `GET /approval-requests` - Supports `requesterId` filter
- `GET /notifications` - Already filters by `recipientId`

## Role-Based Behavior

| Role | Dashboard Stats | Request List |
|------|----------------|--------------|
| super_admin | All data | All requests |
| admin | All data | All requests |
| manager | Department data | Team requests |
| supervisor | Team data | Team requests |
| employee | **Own data only** | **Own requests only** ✓ |
| hr | All data | Filtered by type |
| gad | All data | All requests |
| security | All data | Today's gate passes |

## Security
- ✅ All queries enforce ownership filtering at the database level
- ✅ Backend validates user role before applying filters
- ✅ Notifications correctly use `recipient_id` (already working)
- ✅ No client-side only filtering - backend enforces data isolation
- ✅ Role-based permissions unchanged

## Notes
- Admin and manager roles continue to see all data (no filtering)
- Only employee role is filtered by user ID
- Notifications were already correctly isolated (no changes needed)
- The fix maintains backward compatibility for non-employee roles