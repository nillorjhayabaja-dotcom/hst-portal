# HST Enterprise Portal — Implementation Roadmap
## Phase 7–12: Backend Implementation Strategy

> **Status:** Planning  
> **Prerequisite:** Phase 6 — Enterprise Architecture Blueprint (Complete)  
> **Approach:** Incremental, milestone-based development

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Implementation Phases](#2-implementation-phases)
3. [Sprint Breakdown](#3-sprint-breakdown)
4. [Module Dependency Graph](#4-module-dependency-graph)
5. [Development Guidelines](#5-development-guidelines)

---

## 1. Repository Structure

### Recommended: Three-Repository Architecture

```
hst-enterprise-portal/
│
├── hst-enterprise-frontend/          # Repository 1
│   ├── React 19
│   ├── TypeScript
│   ├── Vite
│   ├── TanStack Router
│   ├── TanStack Query
│   ├── Tailwind CSS
│   ├── shadcn/ui
│   └── src/
│       ├── features/
│       ├── components/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── mock/
│
├── hst-enterprise-api/               # Repository 2
│   ├── Node.js
│   ├── Express.js
│   ├── TypeScript
│   ├── Prisma ORM
│   ├── JWT Authentication
│   ├── RBAC Middleware
│   ├── Workflow Engine
│   ├── Notification Engine
│   └── src/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── interfaces/
│       └── shared/
│
└── hst-enterprise-docs/              # Repository 3
    ├── backend-blueprint.md
    ├── implementation-roadmap.md
    ├── architecture-decisions/
    │   ├── ADR-001-Prisma.md
    │   ├── ADR-002-TanStackRouter.md
    │   └── ...
    ├── api-spec.yaml
    ├── erd.md
    └── deployment-guide.md
```

### Alternative: Monorepo (Initial Development)

If you prefer to keep everything in one repository during initial development:

```
hst-portal/
├── frontend/                 # React app
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                  # Node.js API
│   ├── prisma/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
│
└── docs/                     # Documentation
    ├── backend-blueprint.md
    ├── implementation-roadmap.md
    └── architecture-decisions/
```

**Recommendation:** Start with a monorepo for simplicity. Split into three repositories once the team grows or when CI/CD pipelines become complex.

---

## 2. Implementation Phases

### Phase 7 — Backend Foundation (Sprint 1-2)

**Goal:** Set up the backend project structure, database, and core infrastructure.

**Deliverables:**
- [ ] Backend project initialized (Node.js + TypeScript + Express)
- [ ] Prisma schema created with all tables
- [ ] Database migrations generated and applied
- [ ] Environment configuration (.env files)
- [ ] Logging configured (Pino or Winston)
- [ ] Error handling middleware
- [ ] CORS configuration
- [ ] Rate limiting middleware
- [ ] Request logging middleware
- [ ] Health check endpoint (`GET /health`)

**Success Criteria:**
- `npm run dev` starts the server without errors
- `npx prisma migrate dev` creates and applies migrations
- `npx prisma studio` opens database browser
- `GET /health` returns `{ "status": "ok" }`

---

### Phase 8 — Authentication (Sprint 3)

**Goal:** Implement secure authentication and authorization.

**Deliverables:**
- [ ] User model and repository
- [ ] Login endpoint (`POST /api/v1/auth/login`)
- [ ] Logout endpoint (`POST /api/v1/auth/logout`)
- [ ] Refresh token endpoint (`POST /api/v1/auth/refresh`)
- [ ] Change password endpoint (`POST /api/v1/auth/change-password`)
- [ ] JWT service (access + refresh tokens)
- [ ] bcrypt password hashing
- [ ] Auth middleware (extract and verify JWT)
- [ ] RBAC middleware (check permissions)
- [ ] Password policy enforcement
- [ ] Account lockout after failed attempts
- [ ] Employee number login format validation

**Success Criteria:**
- Login returns access token (15m) + refresh token (7d)
- Access token contains user ID, employee number, roles, department
- RBAC middleware blocks unauthorized access (403)
- Expired tokens return 401 with refresh hint
- Account locks after 5 failed login attempts

---

### Phase 9 — Core Services (Sprint 4-7)

**Goal:** Build the foundational services that all modules depend on.

#### Sprint 4: Employee & Organization Management

**Deliverables:**
- [ ] Employee CRUD endpoints
- [ ] Department CRUD endpoints (hierarchical)
- [ ] Position CRUD endpoints
- [ ] Role CRUD endpoints
- [ ] Permission management endpoints
- [ ] User-Role assignment endpoints
- [ ] Employee-Department-Position relationships
- [ ] Supervisor hierarchy

**Success Criteria:**
- Can create departments with parent-child relationships
- Can assign roles to users
- Can query employees by department
- Can retrieve employee's supervisor chain

#### Sprint 5: Workflow Engine

**Deliverables:**
- [ ] Workflow CRUD endpoints
- [ ] Workflow step CRUD endpoints
- [ ] Workflow activation/deactivation
- [ ] Workflow duplication
- [ ] Step reordering
- [ ] Business rule evaluation engine
- [ ] Dynamic routing based on conditions
- [ ] Workflow versioning

**Success Criteria:**
- Can create a workflow with multiple steps
- Can activate/deactivate workflows
- Business rules route requests to different steps
- Workflow steps can be reordered via API

#### Sprint 6: Notification Engine

**Deliverables:**
- [ ] Notification rule CRUD endpoints
- [ ] Notification template rendering
- [ ] In-app notification channel
- [ ] Email notification channel (Nodemailer)
- [ ] Notification queue (BullMQ)
- [ ] Recipient resolution (roles → users)
- [ ] Unread count endpoint
- [ ] Mark as read endpoint

**Success Criteria:**
- Can create notification rules via API
- Events trigger notifications based on rules
- In-app notifications appear in database
- Email notifications are queued and sent
- Frontend can poll unread count

#### Sprint 7: Audit Engine & Attachments

**Deliverables:**
- [ ] Audit log service
- [ ] Automatic audit logging for all mutations
- [ ] Audit log query endpoints
- [ ] File upload endpoint (`POST /attachments/upload`)
- [ ] File download endpoint
- [ ] File deletion endpoint
- [ ] Attachment metadata storage
- [ ] Local file storage adapter
- [ ] Comment CRUD endpoints

**Success Criteria:**
- Every create/update/delete action is logged
- Audit logs include before/after values
- Can query audit logs by entity type and ID
- File uploads store metadata in database
- Files are stored in `/uploads` directory

---

### Phase 10 — Module Implementation (Sprint 8-14)

**Goal:** Implement business modules in dependency order.

**Implementation Order:**

1. **Gate Pass** (Sprint 8) — First module to test the full workflow
2. **Leave** (Sprint 9) — Tests balance tracking, accrual, holiday exclusion
3. **MRF** (Sprint 10) — Tests position/department validation
4. **Purchase Request** (Sprint 11) — Tests supplier management, budget validation
5. **Visitors** (Sprint 12) — Tests QR code, badge generation
6. **Vehicles** (Sprint 13) — Tests reservation, maintenance scheduling
7. **Assets** (Sprint 14) — Tests lifecycle tracking, barcode/QR

**Each Module Sprint Includes:**
- [ ] Module-specific database tables
- [ ] Repository implementation
- [ ] Service layer (business logic)
- [ ] Controller (HTTP endpoints)
- [ ] DTOs (request/response validation)
- [ ] Routes registration
- [ ] Business rules integration
- [ ] Notification rules
- [ ] Print layout data endpoint
- [ ] Unit tests
- [ ] Integration tests

---

### Phase 11 — Testing (Sprint 15-16)

**Goal:** Ensure code quality and system reliability.

**Deliverables:**
- [ ] Unit tests for all use cases (80% coverage)
- [ ] Integration tests for all endpoints
- [ ] E2E tests for critical workflows
- [ ] Load testing (100 concurrent users)
- [ ] Security testing (OWASP Top 10)
- [ ] Database migration testing
- [ ] Backup/restore testing

**Success Criteria:**
- All tests pass (`npm test`)
- Test coverage ≥ 80%
- API response time p95 < 200ms
- No critical security vulnerabilities

---

### Phase 12 — Production Deployment (Sprint 17-18)

**Goal:** Deploy to production with monitoring and rollback capability.

**Deliverables:**
- [ ] Nginx configuration
- [ ] Cloudflare DNS configuration
- [ ] SSL/TLS certificates (Cloudflare Origin)
- [ ] Dockerfile and docker-compose.yml
- [ ] Environment variables for production
- [ ] Database backup scripts
- [ ] Monitoring setup (application logs, audit logs)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Deployment guide
- [ ] Rollback plan
- [ ] User training materials

**Success Criteria:**
- Application accessible via `https://hst-corp.com`
- HTTPS enforced (TLS 1.3)
- Daily backups running automatically
- Monitoring alerts configured
- Rollback tested and documented

---

## 3. Sprint Breakdown

### Sprint 1: Backend Foundation (Week 1-2)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Initialize Node.js + TypeScript project | 4 | High |
| Configure ESLint + Prettier + Husky | 3 | High |
| Set up Express server with middleware | 4 | High |
| Configure Prisma with PostgreSQL | 6 | High |
| Design and implement database schema | 12 | High |
| Generate and apply migrations | 2 | High |
| Configure environment variables | 2 | High |
| Set up logging (Pino) | 3 | Medium |
| Create error handling middleware | 4 | High |
| Create health check endpoint | 1 | Low |
| **Total** | **41 hours** | |

### Sprint 2: Authentication (Week 3-4)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Implement JWT service (access + refresh) | 6 | High |
| Implement bcrypt password hashing | 2 | High |
| Create login endpoint | 4 | High |
| Create logout endpoint | 2 | Medium |
| Create refresh token endpoint | 3 | High |
| Create change password endpoint | 3 | Medium |
| Implement auth middleware | 4 | High |
| Implement RBAC middleware | 6 | High |
| Implement password policy | 4 | Medium |
| Implement account lockout | 3 | Medium |
| Write unit tests | 8 | High |
| **Total** | **45 hours** | |

### Sprint 3: Employees & Organization (Week 5-6)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Employee CRUD endpoints | 8 | High |
| Department CRUD endpoints (hierarchical) | 6 | High |
| Position CRUD endpoints | 4 | Medium |
| Role CRUD endpoints | 4 | Medium |
| Permission management endpoints | 6 | High |
| User-Role assignment endpoints | 4 | High |
| Employee-Department-Position relationships | 4 | High |
| Supervisor hierarchy | 3 | Medium |
| Write unit tests | 10 | High |
| **Total** | **49 hours** | |

### Sprint 4: Workflow Engine (Week 7-8)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Workflow CRUD endpoints | 6 | High |
| Workflow step CRUD endpoints | 6 | High |
| Workflow activation/deactivation | 2 | Medium |
| Workflow duplication | 3 | Medium |
| Step reordering | 3 | Medium |
| Business rule evaluation engine | 8 | High |
| Dynamic routing logic | 6 | High |
| Workflow versioning | 4 | Medium |
| Write unit tests | 10 | High |
| **Total** | **48 hours** | |

### Sprint 5: Notification Engine (Week 9-10)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Notification rule CRUD endpoints | 6 | High |
| Template rendering engine | 6 | High |
| In-app notification channel | 4 | High |
| Email notification channel (Nodemailer) | 6 | High |
| Notification queue (BullMQ) | 8 | Medium |
| Recipient resolution logic | 4 | High |
| Unread count endpoint | 2 | Medium |
| Mark as read endpoint | 2 | Medium |
| Write unit tests | 8 | High |
| **Total** | **46 hours** | |

### Sprint 6: Audit Engine & Attachments (Week 11-12)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Audit log service | 6 | High |
| Automatic audit logging middleware | 8 | High |
| Audit log query endpoints | 4 | Medium |
| File upload endpoint | 6 | High |
| File download endpoint | 3 | Medium |
| File deletion endpoint | 2 | Medium |
| Local file storage adapter | 4 | High |
| Attachment metadata storage | 4 | High |
| Comment CRUD endpoints | 4 | Medium |
| Write unit tests | 8 | High |
| **Total** | **49 hours** | |

### Sprint 7: Buffer & Integration (Week 13)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Integration testing | 8 | High |
| Bug fixes from previous sprints | 16 | High |
| Performance optimization | 8 | Medium |
| Documentation updates | 4 | Medium |
| **Total** | **36 hours** | |

### Sprints 8-14: Module Implementation (Week 14-26)

Each module sprint follows this pattern:

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Module database tables (Prisma) | 2 | High |
| Repository implementation | 4 | High |
| Service layer (business logic) | 8 | High |
| Controller + DTOs | 6 | High |
| Routes registration | 2 | High |
| Business rules integration | 4 | Medium |
| Notification rules | 3 | Medium |
| Print layout endpoint | 2 | Low |
| Unit tests | 8 | High |
| Integration tests | 4 | High |
| **Total per module** | **43 hours** | |

**7 modules × 43 hours = 301 hours (7.5 weeks @ 40h/week)**

### Sprints 15-16: Testing (Week 27-28)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Unit test coverage improvement | 16 | High |
| Integration test expansion | 12 | High |
| E2E test critical workflows | 16 | High |
| Load testing | 8 | Medium |
| Security testing | 8 | High |
| Bug fixes | 16 | High |
| **Total** | **76 hours** | |

### Sprints 17-18: Production Deployment (Week 29-30)

| Task | Estimated Hours | Priority |
|------|----------------|----------|
| Nginx configuration | 4 | High |
| Cloudflare DNS setup | 2 | High |
| SSL/TLS certificate configuration | 2 | High |
| Dockerfile + docker-compose | 6 | High |
| Environment configuration | 2 | High |
| Database backup scripts | 4 | High |
| CI/CD pipeline (GitHub Actions) | 8 | Medium |
| Monitoring setup | 4 | Medium |
| Deployment guide | 4 | Medium |
| Rollback plan | 2 | Medium |
| User training materials | 8 | Low |
| **Total** | **46 hours** | |

---

## 4. Module Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      Backend Implementation                  │
└─────────────────────────────────────────────────────────────┘

Phase 7: Backend Foundation
├── Node.js + TypeScript + Express
├── Prisma + PostgreSQL
├── Middleware (CORS, Rate Limiting, Logging, Error Handling)
└── Health Check

Phase 8: Authentication
├── JWT Service
├── Password Hashing (bcrypt)
├── Login / Logout / Refresh
├── Auth Middleware
└── RBAC Middleware

Phase 9: Core Services
├── Employees (depends on Auth)
├── Departments (depends on Auth)
├── Roles & Permissions (depends on Auth)
├── Workflow Engine (depends on Auth)
├── Notification Engine (depends on Auth)
└── Audit Engine (depends on Auth)

Phase 10: Business Modules
├── Gate Pass (depends on ALL core services)
│   ├── Uses: Employees, Departments, Workflows, Notifications, Audit
│   └── Features: QR code, vehicle assignment, security release
│
├── Leave (depends on Employees, Workflows, Notifications, Audit)
│   ├── Uses: Leave balances, holiday calendar
│   └── Features: Accrual, carry-over, half-day
│
├── MRF (depends on Employees, Departments, Workflows, Notifications, Audit)
│   ├── Uses: Positions, budget validation
│   └── Features: Recruitment status, skills tracking
│
├── Purchase Request (depends on Employees, Departments, Workflows, Notifications, Audit)
│   ├── Uses: Suppliers, budget codes
│   └── Features: Quotation attachments, amount-based routing
│
├── Visitors (depends on Employees, Workflows, Notifications, Audit)
│   ├── Uses: QR codes, NDA workflow
│   └── Features: Check-in/out, badge generation
│
├── Vehicles (depends on Employees, Departments, Workflows, Notifications, Audit)
│   ├── Uses: Maintenance scheduling, fuel logs
│   └── Features: Reservation calendar, odometer tracking
│
└── Assets (depends on Employees, Departments, Workflows, Notifications, Audit)
    ├── Uses: Barcode/QR, depreciation
    └── Features: Lifecycle tracking, borrow/return

Phase 11: Testing
├── Unit Tests
├── Integration Tests
├── E2E Tests
├── Load Testing
└── Security Testing

Phase 12: Production Deployment
├── Nginx + Cloudflare
├── SSL/TLS
├── Docker
├── CI/CD
├── Monitoring
└── Documentation
```

---

## 5. Development Guidelines

### 5.1 Incremental Development

**DO NOT** generate the entire backend at once. Follow this pattern:

1. **Design** — Write the Prisma schema for the module
2. **Migrate** — Generate and apply migration
3. **Repository** — Implement data access layer
4. **Service** — Implement business logic
5. **Controller** — Implement HTTP endpoints
6. **Test** — Write unit and integration tests
7. **Review** — Test manually with Postman/Thunder Client
8. **Commit** — Commit with descriptive message
9. **Next** — Move to next module

### 5.2 Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(auth): implement JWT refresh token rotation
fix(leave): correct leave balance calculation for half-days
docs(api): add Gate Pass endpoints to OpenAPI spec
test(workflow): add unit tests for business rule evaluation
refactor(notification): extract template rendering to service
chore(deps): upgrade Prisma to 5.22.0
```

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation changes
- `test` — Adding or updating tests
- `refactor` — Code refactoring
- `chore` — Maintenance tasks
- `perf` — Performance improvements

### 5.3 Code Review Checklist

Before merging each module:

- [ ] Prisma schema is normalized (3NF)
- [ ] Migrations are tested (up and down)
- [ ] Repository methods are tested
- [ ] Service layer has unit tests
- [ ] Controller validates input (Zod schemas)
- [ ] RBAC middleware protects endpoints
- [ ] Audit logging is implemented
- [ ] Error responses follow standard format
- [ ] API endpoints are documented in OpenAPI spec
- [ ] No hardcoded secrets or credentials
- [ ] No console.log (use structured logging)

### 5.4 Testing Strategy

**Unit Tests (80% coverage target):**
- Use cases (business logic)
- Repository methods (mock Prisma)
- Services (notification, audit, workflow)
- Utility functions

**Integration Tests:**
- API endpoints (Supertest)
- Database queries (test database)
- Authentication flow
- Authorization flow

**E2E Tests (critical paths only):**
- Login → Submit Gate Pass → Approve → Security Release
- Login → Submit Leave → Approve → Balance Update
- Login → Create Workflow → Assign Steps → Test Routing

### 5.5 Database Migration Best Practices

1. **Never** edit applied migrations — create a new migration
2. **Always** test migrations on a copy of production data
3. **Use** `prisma migrate dev` for development
4. **Use** `prisma migrate deploy` for production
5. **Commit** migration files to version control
6. **Review** generated SQL before applying

### 5.6 API Development Workflow

For each new endpoint:

1. **Define** the route in `routes/v1/{module}.routes.ts`
2. **Create** DTOs (Zod schemas) for request/response
3. **Implement** controller method
4. **Call** use case from controller
5. **Implement** use case (business logic)
6. **Call** repository from use case
7. **Implement** repository method (Prisma query)
8. **Add** RBAC middleware to route
9. **Test** with Postman/Thunder Client
10. **Document** in OpenAPI spec
11. **Write** integration test

---

## Timeline Summary

| Phase | Duration | Weeks | Cumulative |
|-------|----------|-------|------------|
| Phase 7: Backend Foundation | 2 weeks | 1-2 | 2 weeks |
| Phase 8: Authentication | 2 weeks | 3-4 | 4 weeks |
| Phase 9: Core Services | 5 weeks | 5-9 | 9 weeks |
| Phase 10: Module Implementation | 13 weeks | 10-16 | 16 weeks |
| Phase 11: Testing | 2 weeks | 17-18 | 18 weeks |
| Phase 12: Production Deployment | 2 weeks | 19-20 | 20 weeks |

**Total Estimated Time: 20 weeks (5 months) for a single developer @ 40h/week**

---

## Next Steps

1. **Create the three repositories** (or monorepo structure)
2. **Initialize the backend repository** (Phase 7, Sprint 1)
3. **Set up PostgreSQL** on the local server
4. **Create the Prisma schema** based on `docs/backend-blueprint.md` Section 2
5. **Begin Sprint 1** — Backend Foundation

---

*Document Version: 1.0*  
*Last Updated: July 2026*  
*Status: Ready for Implementation*