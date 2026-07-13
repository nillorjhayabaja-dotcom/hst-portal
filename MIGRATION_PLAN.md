# Mock Data Migration Plan

## Current State Analysis

### Mock Files to Remove:
1. `src/mock/data.ts` - EMPLOYEES, DEPARTMENTS, REQUESTS, NOTIFICATIONS, VEHICLES, ASSETS, VISITORS, AUDIT_LOGS, Chart data
2. `src/mock/enterprise-data.ts` - MOCK_SEARCH_RESULTS, MOCK_QUICK_ACTIONS, MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS
3. `src/mock/approval-engine.ts` - WORKFLOWS, APPROVAL_REQUESTS, DELEGATION_RULES, CONTROL_NUMBERS
4. `src/mock/config-data.ts` - DEFAULT_COMPANY, DEPARTMENTS, POSITIONS, EMPLOYEES_EXTENDED, PERMISSION_MATRIX, etc.

### Frontend Services to Replace:
1. `src/services/approval-engine.ts` - Uses mock data, needs real API calls
2. `src/services/search-service.ts` - Uses mock data
3. `src/services/config-engine.ts` - Uses mock data
4. `src/services/export-service.ts` - Has mock PDF export

### Components Using Mock Data:
1. `src/routes/app.m.$moduleId.tsx` - Uses EMPLOYEES, DEPARTMENTS, etc.
2. `src/routes/app.notifications.tsx` - Uses NOTIFICATIONS
3. `src/features/modules/RequestsModule.tsx` - Uses REQUESTS
4. `src/features/modules/PRModule.tsx` - Uses REQUESTS, MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS
5. `src/features/modules/MRFModule.tsx` - Uses REQUESTS, MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS
6. `src/features/modules/LeaveModule.tsx` - Uses REQUESTS, MOCK_COMMENTS, MOCK_ATTACHMENTS, MOCK_TIMELINE_EVENTS
7. `src/features/dashboards/widgets.tsx` - Uses REQUESTS, NOTIFICATIONS
8. `src/features/dashboards/charts.tsx` - Uses MONTHLY_TRENDS, REQUEST_BREAKDOWN, DEPT_PERFORMANCE
9. `src/components/enterprise/WorkflowBuilder.tsx` - Uses approval-engine
10. `src/components/enterprise/DelegationManager.tsx` - Uses approval-engine
11. `src/components/enterprise/ApprovalInbox.tsx` - Uses approval-engine
12. `src/components/enterprise/ApprovalDashboard.tsx` - Uses approval-engine
13. `src/components/enterprise/RequestFramework.tsx` - Uses search-service, MOCK_QUICK_ACTIONS
14. `src/components/enterprise/GlobalSearch.tsx` - Uses MOCK_RECENT_SEARCHES, MOCK_REMINDERS
15. `src/components/enterprise/NotificationCenter.tsx` - Uses mock data
16. `src/components/enterprise/QuickActionCards.tsx` - Uses MOCK_QUICK_ACTIONS

## Backend APIs Available:
- GET /api/v1/dashboard/overview
- GET /api/v1/dashboard/metrics
- GET /api/v1/dashboard/charts
- GET /api/v1/approval-requests
- POST /api/v1/approval/:id/approve
- POST /api/v1/approval/:id/reject
- POST /api/v1/approval/:id/return
- GET /api/v1/notifications
- POST /api/v1/notifications/:id/read
- GET /api/v1/comments/:entityType/:entityId
- POST /api/v1/comments/:entityType/:entityId
- GET /api/v1/attachments/:entityType/:entityId
- POST /api/v1/attachments/upload
- GET /api/v1/search
- GET /api/v1/employees
- GET /api/v1/departments
- GET /api/v1/workflows
- GET /api/v1/delegations
- And many more...

## Migration Strategy

### Phase 1: Create Real API Services
1. Create `src/services/api-client.ts` - Base API client with TanStack Query integration
2. Create `src/services/dashboard-api.ts` - Dashboard API calls
3. Create `src/services/approval-api.ts` - Approval workflow API calls
4. Create `src/services/notification-api.ts` - Notification API calls
5. Create `src/services/search-api.ts` - Search API calls
6. Create `src/services/config-api.ts` - Configuration API calls
7. Create `src/services/employee-api.ts` - Employee API calls
8. Create `src/services/comment-api.ts` - Comment API calls
9. Create `src/services/attachment-api.ts` - Attachment API calls

### Phase 2: Replace Mock Services
1. Update `src/services/approval-engine.ts` to use real APIs
2. Update `src/services/search-service.ts` to use real APIs
3. Update `src/services/config-engine.ts` to use real APIs
4. Update `src/services/export-service.ts` to remove mock

### Phase 3: Update Components
1. Update Dashboard components to use real data
2. Update Approval Inbox to use real data
3. Update Notification Center to use real data
4. Update all module components (Gate Pass, Leave, MRF, PR, etc.)
5. Update Global Search
6. Update Workflow Builder
7. Update Delegation Manager

### Phase 4: Integrate TanStack Query
1. Add useQuery for all data fetching
2. Add useMutation for all mutations
3. Add query invalidation
4. Add optimistic updates where appropriate

### Phase 5: Cleanup
1. Delete src/mock/ folder
2. Verify zero mock imports
3. Verify TypeScript compilation
4. Test all modules

## Implementation Order

1. Start with Dashboard (highest impact, most visible)
2. Then Approval Inbox (critical workflow)
3. Then Notifications (user engagement)
4. Then operational modules (Gate Pass, Leave, MRF, PR)
5. Then supporting features (Search, Comments, Attachments)
6. Finally cleanup

## Success Criteria
- Zero mock imports in codebase
- All data from PostgreSQL via Express APIs
- UI remains exactly the same
- All TanStack Query patterns implemented
- TypeScript compiles with zero errors