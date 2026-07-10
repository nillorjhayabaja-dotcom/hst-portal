# Phase 8 - Remove Mock Environment & Transition to Real DB Authentication

## Step 1 (frontend): Remove demo role UI

- [ ] Delete `src/components/app/RoleSwitcher.tsx`
- [ ] Remove RoleSwitcher import/render usage from layout/app shell
- [ ] Remove any floating demo panel styles/refs

## Step 2 (frontend): Remove role mutation from AuthContext

- [ ] Update `src/contexts/AuthContext.tsx` to remove `switchRole` API and demo-only mutation
- [ ] Remove `switchRole` from context type/value

## Step 3 (frontend): Remove frontend mock datasets

- [ ] Delete `src/mock/*` files
- [ ] Remove any imports/usage of `src/mock/*` in app code

## Step 4 (frontend): Remove hardcoded frontend RBAC matrix

- [ ] Update `src/components/app/SidebarNav.tsx` to build menu from backend-provided permissions/roles
- [ ] Remove usage of `src/rbac/permissions.ts`
- [ ] Ensure permission checks use backend data only

## Step 5 (backend): Extend Prisma seed with 9 system users + roles/permissions

- [ ] Update `backend/prisma/seed.ts` to create roles: super_admin, admin, executive, manager, supervisor, hr, gad, security, employee
- [ ] Create HS0001-0001 .. HS0001-0009 users with bcrypt hashes (Admin@12345)
- [ ] Ensure permissions are inserted for each role so sidebar/modules render correctly

## Step 6 (backend/frontend integration): Ensure refresh + session loads user/roles/permissions

- [ ] Confirm login refresh flow returns user + roles/permissions needed by frontend
- [ ] Remove any frontend fallbacks that rely on hardcoded permissions

## Step 7 (frontend): Dashboard from real APIs

- [ ] Replace mock dashboard stats with API calls

## Step 8 (frontend): Users & Roles page from PostgreSQL

- [ ] Ensure CRUD/search/pagination uses backend endpoints
- [ ] Add audit logging if not already present

## Step 9 (verification)

- [ ] No demo buttons/panels exist in UI
- [ ] No localStorage role switching exists
- [ ] Login uses PostgreSQL-backed JWT
- [ ] Sidebar is filtered by backend permissions
- [ ] Dashboard loads real data
- [ ] Users page lists DB users only
