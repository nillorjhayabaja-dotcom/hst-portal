# HST Enterprise Portal — Backend Architecture Blueprint

## Phase 6 — Enterprise Backend & Database Design

> **Status:** Planning / Blueprint  
> **Target Stack:** Node.js + PostgreSQL + JWT  
> **Pattern:** Clean Architecture / Hexagonal Architecture  
> **Scope:** Full ERP backend covering all 10+ operational modules

---

## Table of Contents

0. [Technology Stack](#0-technology-stack)
1. [Project Structure](#1-project-structure)
2. [Database Design (3NF)](#2-database-design-3nf)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [REST API Specification](#4-rest-api-specification)
5. [Service Layer Architecture](#5-service-layer-architecture)
6. [Audit Engine](#6-audit-engine)
7. [Notification Service](#7-notification-service)
8. [File Storage Strategy](#8-file-storage-strategy)
9. [Background Jobs & Escalation](#9-background-jobs--escalation)
10. [Error Handling & Transactions](#10-error-handling--transactions)
11. [API Documentation (OpenAPI)](#11-api-documentation-openapi)
12. [Module Functional Completion (5.5)](#12-module-functional-completion-55)

---

## 0. Technology Stack

### HST Enterprise Portal — Final Technology Stack

#### Frontend

| Technology      | Purpose                                                     |
| --------------- | ----------------------------------------------------------- |
| React 19        | Frontend Framework                                          |
| TypeScript      | Type Safety                                                 |
| Vite            | Development & Build Tool                                    |
| TanStack Router | File-based routing, nested layouts, route protection (RBAC) |
| TanStack Query  | API state management, caching, optimistic updates           |
| Tailwind CSS    | Styling                                                     |
| shadcn/ui       | Enterprise UI Components                                    |
| React Hook Form | Form handling                                               |
| Zod             | Form and API validation                                     |
| Lucide React    | Icons                                                       |
| Recharts        | Analytics dashboards                                        |
| Sonner          | Toast notifications                                         |
| date-fns        | Date utilities                                              |

#### Backend

| Technology                                                | Purpose                                          |
| --------------------------------------------------------- | ------------------------------------------------ |
| Node.js (LTS)                                             | Runtime                                          |
| Express.js (or Fastify if performance becomes a priority) | REST API                                         |
| TypeScript                                                | Backend language                                 |
| Prisma ORM                                                | PostgreSQL ORM and migrations                    |
| JWT                                                       | Authentication                                   |
| bcrypt                                                    | Password hashing                                 |
| Multer                                                    | File uploads                                     |
| Nodemailer                                                | Email notifications                              |
| node-cron                                                 | Scheduled jobs (escalations, reminders, cleanup) |

#### Database

| Technology   | Purpose                 |
| ------------ | ----------------------- |
| PostgreSQL   | Main ERP database       |
| pgAdmin 4    | Database administration |
| Local Server | On-premises hosting     |

#### Infrastructure

| Technology                            | Purpose                             |
| ------------------------------------- | ----------------------------------- |
| Cloudflare (Free)                     | Domain, DNS, HTTPS, DDoS protection |
| Nginx                                 | Reverse proxy for React and Node.js |
| Local Windows Server or Ubuntu Server | Application hosting                 |
| Local File Storage                    | Attachments and uploaded documents  |
| Git                                   | Version control                     |
| GitHub                                | Source code repository              |

#### Authentication & Security

- Employee Number login (e.g. `HS2606-1980`)
- JWT Access Token
- Refresh Token
- RBAC Middleware
- Permission Matrix
- bcrypt password hashing
- HTTPS
- CORS
- Rate limiting
- Audit Logging

#### ERP Features Already Designed

- Enterprise RBAC
- Universal Workflow Engine
- Approval Engine
- Notification Engine
- Business Rules Engine
- Control Number Engine
- Configuration Platform
- Organization Hierarchy
- Audit Logs
- Dashboard Analytics

#### Deployment Architecture

```
                        Internet
                           │
                           ▼
                 Cloudflare (Free)
             DNS • SSL • DDoS Protection
                           │
                           ▼
                   Public IP Address
                           │
                           ▼
                    Nginx Reverse Proxy
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
      React + Vite Frontend     Node.js REST API
      (TanStack Router)          (Express/Fastify)
                │                     │
                └──────────┬──────────┘
                           ▼
                  PostgreSQL Database
                     (Local Server)
                           │
                           ▼
                  Local File Storage
```

#### Project Structure

```
HST Enterprise Portal

Frontend
│
├── React 19
├── TypeScript
├── Vite
├── TanStack Router
├── TanStack Query
├── Tailwind CSS
├── shadcn/ui
├── React Hook Form
├── Zod
└── Recharts

Backend
│
├── Node.js
├── Express.js
├── TypeScript
├── Prisma ORM
├── JWT Authentication
├── RBAC Middleware
├── Workflow Engine
├── Notification Engine
└── Audit Logging

Database
│
└── PostgreSQL

Infrastructure
│
├── Local Server
├── Nginx
├── Cloudflare Free
└── GitHub
```

---

## 1. Project Structure

```
backend/
├── prisma/                       # Prisma schema & migrations
│   ├── schema.prisma             # Database schema definition
│   ├── migrations/               # Auto-generated migrations
│   └── seed.ts                   # Initial seed data
│
├── src/
│   ├── domain/                    # Enterprise business entities
│   │   ├── entities/              # Plain objects, no ORM
│   │   │   ├── user.ts
│   │   │   ├── role.ts
│   │   │   ├── permission.ts
│   │   │   ├── department.ts
│   │   │   ├── position.ts
│   │   │   ├── employee.ts
│   │   │   ├── workflow.ts
│   │   │   ├── approval-request.ts
│   │   │   ├── delegation.ts
│   │   │   ├── notification.ts
│   │   │   ├── attachment.ts
│   │   │   ├── comment.ts
│   │   │   ├── audit-log.ts
│   │   │   ├── company-profile.ts
│   │   │   ├── holiday.ts
│   │   │   ├── business-rule.ts
│   │   │   ├── control-number.ts
│   │   │   ├── gate-pass.ts
│   │   │   ├── leave.ts
│   │   │   ├── mrf.ts
│   │   │   ├── purchase-request.ts
│   │   │   ├── visitor.ts
│   │   │   ├── vehicle.ts
│   │   │   └── asset.ts
│   │   ├── value-objects/         # Immutable typed values
│   │   │   ├── email.ts
│   │   │   ├── phone.ts
│   │   │   ├── address.ts
│   │   │   ├── money.ts
│   │   │   ├── control-number.ts
│   │   │   └── date-range.ts
│   │   └── events/                # Domain events
│   │       ├── approval-approved.ts
│   │       ├── approval-rejected.ts
│   │       ├── request-submitted.ts
│   │       └── escalation-triggered.ts
│   │
│   ├── application/               # Use cases / application services
│   │   ├── auth/
│   │   │   ├── login.usecase.ts
│   │   │   ├── refresh-token.usecase.ts
│   │   │   └── change-password.usecase.ts
│   │   ├── approval/
│   │   │   ├── approve-request.usecase.ts
│   │   │   ├── reject-request.usecase.ts
│   │   │   ├── return-request.usecase.ts
│   │   │   ├── delegate-approval.usecase.ts
│   │   │   └── recall-request.usecase.ts
│   │   ├── workflow/
│   │   │   ├── create-workflow.usecase.ts
│   │   │   ├── evaluate-rules.usecase.ts
│   │   │   └── determine-next-step.usecase.ts
│   │   ├── configuration/
│   │   │   ├── update-company.usecase.ts
│   │   │   ├── manage-department.usecase.ts
│   │   │   ├── manage-position.usecase.ts
│   │   │   └── manage-holiday.usecase.ts
│   │   └── module/                 # Per-module use cases
│   │       ├── gate-pass/
│   │       ├── leave/
│   │       ├── mrf/
│   │       ├── purchase-request/
│   │       ├── visitor/
│   │       ├── vehicle/
│   │       └── asset/
│   │
│   ├── infrastructure/            # Adapters / external concerns
│   │   ├── database/
│   │   │   ├── prisma.service.ts   # Prisma client singleton
│   │   │   ├── repositories/       # Repository implementations
│   │   │   │   ├── user.repository.ts
│   │   │   │   ├── approval.repository.ts
│   │   │   │   ├── workflow.repository.ts
│   │   │   │   ├── notification.repository.ts
│   │   │   │   ├── audit.repository.ts
│   │   │   │   ├── module-repositories/ # gate-pass, leave, etc.
│   │   │   │   └── config-repositories/ # company, dept, etc.
│   │   │   └── seed/              # Initial seed data
│   │   ├── auth/
│   │   │   ├── jwt.service.ts
│   │   │   ├── bcrypt.service.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── storage/
│   │   │   ├── file-storage.service.ts
│   │   │   └── local-storage.adapter.ts
│   │   ├── notifications/
│   │   │   ├── email.service.ts
│   │   │   ├── in-app.service.ts
│   │   │   └── notification-queue.ts
│   │   ├── background-jobs/
│   │   │   ├── escalation.job.ts
│   │   │   ├── reminder.job.ts
│   │   │   └── scheduler.ts
│   │   └── audit/
│   │       └── audit.service.ts
│   │
│   ├── interfaces/                # Controllers / API layer
│   │   ├── http/
│   │   │   ├── server.ts           # Express/Fastify setup
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── rbac.ts
│   │   │   │   ├── validator.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   ├── request-logger.ts
│   │   │   │   └── rate-limiter.ts
│   │   │   ├── routes/
│   │   │   │   ├── v1/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── approval.routes.ts
│   │   │   │   │   ├── workflow.routes.ts
│   │   │   │   │   ├── delegation.routes.ts
│   │   │   │   │   ├── notification.routes.ts
│   │   │   │   │   ├── gate-pass.routes.ts
│   │   │   │   │   ├── leave.routes.ts
│   │   │   │   │   ├── mrf.routes.ts
│   │   │   │   │   ├── purchase-request.routes.ts
│   │   │   │   │   ├── visitor.routes.ts
│   │   │   │   │   ├── vehicle.routes.ts
│   │   │   │   │   ├── asset.routes.ts
│   │   │   │   │   ├── employee.routes.ts
│   │   │   │   │   ├── department.routes.ts
│   │   │   │   │   ├── position.routes.ts
│   │   │   │   │   ├── company.routes.ts
│   │   │   │   │   ├── holiday.routes.ts
│   │   │   │   │   ├── business-rule.routes.ts
│   │   │   │   │   ├── notification-rule.routes.ts
│   │   │   │   │   ├── control-number.routes.ts
│   │   │   │   │   ├── audit-log.routes.ts
│   │   │   │   │   ├── attachment.routes.ts
│   │   │   │   │   ├── comment.routes.ts
│   │   │   │   │   ├── dashboard.routes.ts
│   │   │   │   │   └── search.routes.ts
│   │   │   │   └── index.ts       # Route aggregator
│   │   │   └── dto/               # Request/Response DTOs
│   │   │       ├── auth.dto.ts
│   │   │       ├── approval.dto.ts
│   │   │       └── ...
│   │   └── graphql/               # (future) Optional GraphQL layer
│   │
│   └── shared/
│       ├── errors/
│       │   ├── app-error.ts
│       │   ├── not-found.error.ts
│       │   ├── validation.error.ts
│       │   ├── unauthorized.error.ts
│       │   └── forbidden.error.ts
│       ├── types/
│       │   ├── pagination.ts
│       │   ├── api-response.ts
│       │   └── request-context.ts
│       └── utils/
│           ├── date.ts
│           ├── crypto.ts
│           └── slug.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                       # DB setup, seed, backup
├── docs/
│   ├── api-spec.yaml              # OpenAPI 3.x
│   └── erd.md                     # Entity relationship documentation
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## 2. Database Design (3NF)

### 2.1 Domain: Authentication & Identity

```sql
-- ============================================================
-- Identity & Access Management
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     VARCHAR(20) UNIQUE NOT NULL,    -- e.g. EMP-1042
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(150) NOT NULL,
    avatar_url      VARCHAR(500),

    -- Account state
    is_active       BOOLEAN DEFAULT true,
    is_locked       BOOLEAN DEFAULT false,
    locked_until    TIMESTAMP,
    login_attempts  INT DEFAULT 0,
    last_login_at   TIMESTAMP,
    password_changed_at TIMESTAMP DEFAULT now(),
    must_change_password BOOLEAN DEFAULT false,

    -- 2FA (future)
    two_factor_enabled  BOOLEAN DEFAULT false,
    two_factor_secret   VARCHAR(100),

    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE roles (
    id              VARCHAR(30) PRIMARY KEY,        -- super_admin, admin, manager, etc.
    name            VARCHAR(100) NOT NULL,
    short_name      VARCHAR(50),
    level           INT NOT NULL,                   -- 1=highest, 9=employee
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE user_roles (
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id         VARCHAR(30) REFERENCES roles(id),
    assigned_by     UUID REFERENCES users(id),
    assigned_at     TIMESTAMP DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id         VARCHAR(30) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module_id       VARCHAR(50) NOT NULL,           -- gate-pass, leave, etc.
    actions         TEXT[] NOT NULL,                 -- {create,view,edit,delete,approve,export,full}
    scope           VARCHAR(20) NOT NULL DEFAULT 'own'  -- all, department, own
);

CREATE INDEX idx_permissions_role ON permissions(role_id);
```

### 2.2 Domain: Organization

```sql
-- ============================================================
-- Organization Structure
-- ============================================================

CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    parent_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
    head_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    description     TEXT,
    level           INT NOT NULL DEFAULT 1,
    sort_order      INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_dept_parent ON departments(parent_id);

CREATE TABLE positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(200) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    department_id   UUID NOT NULL REFERENCES departments(id),
    default_role_id VARCHAR(30) REFERENCES roles(id),
    reports_to_id   UUID REFERENCES positions(id),
    level           INT NOT NULL DEFAULT 1,
    has_approval_authority BOOLEAN DEFAULT false,
    max_approval_amount    NUMERIC(15,2),
    job_description       TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_position_dept ON positions(department_id);

CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number VARCHAR(20) UNIQUE NOT NULL,
    user_id         UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(30),
    title           VARCHAR(200),
    department_id   UUID REFERENCES departments(id),
    position_id     UUID REFERENCES positions(id),
    supervisor_id   UUID REFERENCES employees(id),
    hire_date       DATE NOT NULL,
    status          VARCHAR(20) DEFAULT 'active', -- active, on_leave, inactive, terminated
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_employee_dept ON employees(department_id);
CREATE INDEX idx_employee_supervisor ON employees(supervisor_id);
```

### 2.3 Domain: Company Configuration

```sql
-- ============================================================
-- Configuration
-- ============================================================

CREATE TABLE company_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    legal_name          VARCHAR(300) NOT NULL,
    logo_url            VARCHAR(500),
    address             TEXT,
    tin                 VARCHAR(50),
    contact_number      VARCHAR(30),
    email               VARCHAR(255),
    website             VARCHAR(255),
    default_timezone    VARCHAR(50) DEFAULT 'Asia/Manila',
    business_hours_start TIME DEFAULT '08:00',
    business_hours_end   TIME DEFAULT '17:00',
    working_days        INT[] DEFAULT '{1,2,3,4,5}',  -- 0=Sun, 6=Sat
    fiscal_year_start   VARCHAR(5) DEFAULT '01-01',
    currency            VARCHAR(3) DEFAULT 'PHP',
    currency_symbol     VARCHAR(5) DEFAULT '₱',
    language            VARCHAR(10) DEFAULT 'en',
    date_format         VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format         VARCHAR(20) DEFAULT 'HH:mm',
    updated_at          TIMESTAMP DEFAULT now()
);

CREATE TABLE system_settings (
    key                 VARCHAR(100) PRIMARY KEY,
    value               TEXT NOT NULL,
    category            VARCHAR(50) NOT NULL,
    description         TEXT,
    setting_type        VARCHAR(20) NOT NULL DEFAULT 'text', -- text, number, boolean, select, json
    options             JSONB,
    updated_at          TIMESTAMP DEFAULT now()
);

CREATE TABLE holidays (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    date            DATE NOT NULL,
    type            VARCHAR(30) NOT NULL, -- regular, special_non_working, special_working, company_event
    is_recurring    BOOLEAN DEFAULT false,
    department_id   UUID REFERENCES departments(id),
    description     TEXT,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_holiday_date ON holidays(date);

CREATE TABLE control_number_series (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       VARCHAR(50) NOT NULL UNIQUE,
    prefix          VARCHAR(10) NOT NULL,
    separator       VARCHAR(2) DEFAULT '-',
    include_year    BOOLEAN DEFAULT true,
    include_month   BOOLEAN DEFAULT false,
    sequence_length INT DEFAULT 6,
    format_pattern  VARCHAR(100) NOT NULL,  -- {PREFIX}{SEP}{YEAR}{SEP}{SEQ}
    next_sequence   INT NOT NULL DEFAULT 1,
    is_active       BOOLEAN DEFAULT true,
    updated_at      TIMESTAMP DEFAULT now()
);
```

### 2.4 Domain: Workflow & Approvals

```sql
-- ============================================================
-- Workflow Engine
-- ============================================================

CREATE TABLE workflows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       VARCHAR(50) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    version         INT NOT NULL DEFAULT 1,
    is_active       BOOLEAN DEFAULT true,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_workflow_module ON workflows(module_id);

CREATE TABLE workflow_steps (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id         UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    name                VARCHAR(200) NOT NULL,
    role_id             VARCHAR(30) NOT NULL REFERENCES roles(id),
    step_order          INT NOT NULL,
    is_required         BOOLEAN DEFAULT true,
    label               VARCHAR(200),
    description         TEXT,
    auto_approve        BOOLEAN DEFAULT false,
    -- Escalation
    escalation_enabled  BOOLEAN DEFAULT false,
    escalation_role_id  VARCHAR(30) REFERENCES roles(id),
    escalation_hours    INT,
    -- Parallel approval
    parallel_approval   BOOLEAN DEFAULT false,
    -- Condition (for dynamic routing)
    condition_field     VARCHAR(100),
    condition_operator  VARCHAR(10),
    condition_value     TEXT,
    created_at          TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_wfstep_workflow ON workflow_steps(workflow_id);

CREATE TABLE approval_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_number  VARCHAR(50) NOT NULL UNIQUE,
    module_id       VARCHAR(50) NOT NULL,
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    requester_id    UUID NOT NULL REFERENCES users(id),
    department_id   UUID REFERENCES departments(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'draft', -- draft, pending, in_review, approved, rejected, returned, cancelled
    priority        VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
    workflow_id     UUID REFERENCES workflows(id),
    current_step_index INT DEFAULT 0,
    delegated_to    UUID REFERENCES users(id),
    metadata        JSONB,                       -- module-specific data
    submitted_at    TIMESTAMP,
    completed_at    TIMESTAMP,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_apr_status ON approval_requests(status);
CREATE INDEX idx_apr_requester ON approval_requests(requester_id);
CREATE INDEX idx_apr_module ON approval_requests(module_id);
CREATE INDEX idx_apr_control ON approval_requests(control_number);

CREATE TABLE approval_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_id         UUID REFERENCES workflow_steps(id),
    name            VARCHAR(200) NOT NULL,
    role_id         VARCHAR(30) NOT NULL,
    step_order      INT NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, current, approved, rejected, skipped, escalated
    actor_id        UUID REFERENCES users(id),
    note            TEXT,
    duration        VARCHAR(30),                 -- e.g. "2h 15m"
    escalated       BOOLEAN DEFAULT false,
    escalated_at    TIMESTAMP,
    original_actor  UUID REFERENCES users(id),
    assigned_at     TIMESTAMP,
    acted_at        TIMESTAMP,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_apstep_request ON approval_steps(request_id);

CREATE TABLE approval_actions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID NOT NULL REFERENCES approval_requests(id),
    step_id         UUID REFERENCES approval_steps(id),
    action          VARCHAR(20) NOT NULL,        -- approve, reject, return, delegate, recall
    actor_id        UUID NOT NULL REFERENCES users(id),
    note            TEXT,
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_apaction_request ON approval_actions(request_id);

CREATE TABLE delegations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id    UUID NOT NULL REFERENCES users(id),
    delegate_id     UUID NOT NULL REFERENCES users(id),
    module_id       VARCHAR(50),                 -- NULL = all modules
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    reason          TEXT,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_delegation_delegator ON delegations(delegator_id);
CREATE INDEX idx_delegation_delegate ON delegations(delegate_id);

CREATE TABLE business_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    module_id       VARCHAR(50) NOT NULL,
    priority        INT DEFAULT 0,
    conditions      JSONB NOT NULL,              -- [{field, operator, value}]
    actions         JSONB NOT NULL,              -- [{type, target, value}]
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

### 2.5 Domain: Notifications

```sql
-- ============================================================
-- Notifications
-- ============================================================

CREATE TABLE notification_rules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       VARCHAR(50) NOT NULL,
    event           VARCHAR(50) NOT NULL,        -- submitted, approved, rejected, returned, escalated
    notify_role_ids VARCHAR(30)[],               -- roles to notify
    notify_user_ids UUID[],                      -- specific users to notify
    channels        VARCHAR(20)[] NOT NULL DEFAULT '{in_app}',  -- in_app, email, sms
    template_subject VARCHAR(300) NOT NULL,
    template_body   TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type            VARCHAR(30) NOT NULL,        -- approval_required, approved, rejected, etc.
    title           VARCHAR(300) NOT NULL,
    message         TEXT,
    recipient_id    UUID NOT NULL REFERENCES users(id),
    request_id      UUID REFERENCES approval_requests(id),
    control_number  VARCHAR(50),
    module_id       VARCHAR(50),
    action_url      VARCHAR(500),
    is_read         BOOLEAN DEFAULT false,
    read_at         TIMESTAMP,
    channel         VARCHAR(20) NOT NULL DEFAULT 'in_app', -- in_app, email, sms
    sent_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id);
CREATE INDEX idx_notif_unread ON notifications(recipient_id, is_read) WHERE is_read = false;
```

### 2.6 Domain: Audit

```sql
-- ============================================================
-- Audit & Activity Logs
-- ============================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id        UUID REFERENCES users(id),
    actor_name      VARCHAR(200),
    action          VARCHAR(50) NOT NULL,        -- create, read, update, delete, approve, reject, login, logout
    entity_type     VARCHAR(50) NOT NULL,        -- gate_pass, leave, approval, user, role, etc.
    entity_id       VARCHAR(50),
    target_id       UUID,                        -- FK to the entity
    changes         JSONB,                       -- before/after diff
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    metadata        JSONB,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
```

### 2.7 Domain: Attachments & Comments

```sql
-- ============================================================
-- Attachments & Comments
-- ============================================================

CREATE TABLE attachments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,        -- gate_pass, leave, approval_request, etc.
    entity_id       UUID NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_size       INT NOT NULL,                -- bytes
    mime_type       VARCHAR(100) NOT NULL,
    storage_path    VARCHAR(500) NOT NULL,       -- s3://bucket/path or /uploads/path
    storage_type    VARCHAR(20) DEFAULT 'local', -- local, s3, minio
    uploaded_by     UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_attachment_entity ON attachments(entity_type, entity_id);

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID NOT NULL,
    parent_id       UUID REFERENCES comments(id), -- for threaded replies
    author_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    mentions        UUID[],                     -- users mentioned
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_comment_entity ON comments(entity_type, entity_id);
```

### 2.8 Module-Specific Tables

#### Gate Pass

```sql
CREATE TABLE gate_passes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID UNIQUE REFERENCES approval_requests(id) ON DELETE CASCADE,
    purpose         TEXT NOT NULL,
    transportation  VARCHAR(30),                 -- company_vehicle, third_party, personal
    vehicle_id      UUID REFERENCES vehicles(id),
    driver_name     VARCHAR(200),
    items           JSONB,                       -- [{description, quantity, unit}]
    destination     TEXT,
    expected_return TIMESTAMP,
    actual_return   TIMESTAMP,
    qr_code         VARCHAR(500),                -- QR for security scanning
    security_released_by UUID REFERENCES users(id),
    security_released_at TIMESTAMP,
    print_count     INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

#### Leave

```sql
CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID UNIQUE REFERENCES approval_requests(id) ON DELETE CASCADE,
    leave_type      VARCHAR(30) NOT NULL,        -- vacation, sick, emergency, bereavement, maternity, paternity
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      NUMERIC(4,1) NOT NULL,       -- 0.5 for half-day
    is_half_day     BOOLEAN DEFAULT false,
    half_day_period VARCHAR(10),                 -- AM, PM
    reason          TEXT NOT NULL,
    doctor_note_url VARCHAR(500),
    -- Leave balance snapshots (at time of request)
    leave_credits_before JSONB,
    leave_credits_after  JSONB,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE leave_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    leave_type      VARCHAR(30) NOT NULL,
    total_credits   NUMERIC(5,1) NOT NULL DEFAULT 0,
    used_credits    NUMERIC(5,1) NOT NULL DEFAULT 0,
    pending_credits NUMERIC(5,1) NOT NULL DEFAULT 0,
    fiscal_year     INT NOT NULL,
    updated_at      TIMESTAMP DEFAULT now(),
    UNIQUE (employee_id, leave_type, fiscal_year)
);
```

#### MRF

```sql
CREATE TABLE mrf_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID UNIQUE REFERENCES approval_requests(id) ON DELETE CASCADE,
    position_title  VARCHAR(200) NOT NULL,
    department_id   UUID REFERENCES departments(id),
    headcount       INT NOT NULL,
    employment_type VARCHAR(30),                 -- regular, contractual, probationary
    justification   TEXT NOT NULL,
    required_skills TEXT[],
    salary_range_min NUMERIC(15,2),
    salary_range_max NUMERIC(15,2),
    target_date     DATE,
    recruitment_status VARCHAR(30) DEFAULT 'pending', -- pending, sourcing, interviewing, hired, closed
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

#### Purchase Request

```sql
CREATE TABLE purchase_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id      UUID UNIQUE REFERENCES approval_requests(id) ON DELETE CASCADE,
    supplier_id     UUID REFERENCES suppliers(id),
    department_id   UUID REFERENCES departments(id),
    cost_center     VARCHAR(50),
    items           JSONB NOT NULL,              -- [{item, description, quantity, unit_price, total}]
    total_amount    NUMERIC(15,2) NOT NULL,
    budget_code     VARCHAR(50),
    is_capital_expense BOOLEAN DEFAULT false,
    delivery_date   DATE,
    payment_terms   VARCHAR(100),
    quotations      UUID[],                     -- attachment IDs
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    tin             VARCHAR(50),
    address         TEXT,
    contact_person  VARCHAR(200),
    contact_number  VARCHAR(30),
    email           VARCHAR(255),
    is_approved     BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT now()
);
```

#### Visitors

```sql
CREATE TABLE visitors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    company         VARCHAR(200),
    contact_number  VARCHAR(30),
    email           VARCHAR(255),
    host_id         UUID REFERENCES employees(id),
    purpose         TEXT,
    vehicle_plate   VARCHAR(20),
    nda_signed      BOOLEAN DEFAULT false,
    nda_file_url    VARCHAR(500),
    qr_code         VARCHAR(500),
    check_in_at     TIMESTAMP,
    check_out_at    TIMESTAMP,
    badge_issued    BOOLEAN DEFAULT false,
    status          VARCHAR(20) DEFAULT 'scheduled', -- scheduled, checked_in, checked_out, cancelled
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);
```

#### Vehicles

```sql
CREATE TABLE vehicles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number    VARCHAR(20) UNIQUE NOT NULL,
    brand           VARCHAR(100),
    model           VARCHAR(100),
    year            INT,
    color           VARCHAR(30),
    vehicle_type    VARCHAR(30),                 -- sedan, pickup, truck, van, forklift
    fuel_type       VARCHAR(20),                 -- diesel, gasoline, electric
    status          VARCHAR(20) DEFAULT 'available', -- available, in_use, maintenance, retired
    assigned_driver UUID REFERENCES employees(id),
    assigned_department UUID REFERENCES departments(id),
    last_maintenance_at TIMESTAMP,
    next_maintenance_at TIMESTAMP,
    odometer_reading INT,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE vehicle_reservations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    reserved_by     UUID NOT NULL REFERENCES users(id),
    purpose         TEXT NOT NULL,
    start_time      TIMESTAMP NOT NULL,
    end_time        TIMESTAMP NOT NULL,
    destination     TEXT,
    status          VARCHAR(20) DEFAULT 'pending', -- pending, approved, in_use, completed, cancelled
    actual_start    TIMESTAMP,
    actual_end      TIMESTAMP,
    odometer_before INT,
    odometer_after  INT,
    created_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE vehicle_maintenance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
    type            VARCHAR(30) NOT NULL,        -- scheduled, repair, inspection
    description     TEXT,
    scheduled_at    DATE,
    completed_at    DATE,
    cost            NUMERIC(15,2),
    service_provider VARCHAR(200),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT now()
);
```

#### Assets

```sql
CREATE TABLE assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag       VARCHAR(50) UNIQUE NOT NULL,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50),                 -- IT Equipment, Machinery, Furniture, Vehicle, etc.
    brand           VARCHAR(100),
    model           VARCHAR(100),
    serial_number   VARCHAR(100),
    barcode         VARCHAR(100) UNIQUE,
    qr_code         VARCHAR(500),
    purchase_date   DATE,
    purchase_cost   NUMERIC(15,2),
    current_value   NUMERIC(15,2),
    status          VARCHAR(20) DEFAULT 'available', -- available, assigned, maintenance, retired, disposed
    assigned_to     UUID REFERENCES employees(id),
    assigned_department UUID REFERENCES departments(id),
    location        VARCHAR(200),
    warranty_expiry DATE,
    useful_life_years INT,
    depreciation_method VARCHAR(30),
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT now(),
    updated_at      TIMESTAMP DEFAULT now()
);

CREATE TABLE asset_transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id        UUID NOT NULL REFERENCES assets(id),
    transaction_type VARCHAR(30) NOT NULL,       -- assign, return, transfer, maintenance, dispose
    from_employee   UUID REFERENCES employees(id),
    to_employee     UUID REFERENCES employees(id),
    from_department UUID REFERENCES departments(id),
    to_department   UUID REFERENCES departments(id),
    notes           TEXT,
    performed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMP DEFAULT now()
);
```

### 2.9 Entity Relationship Summary

```
users ──1:1── employees ──N:1── departments
                                N:1── positions
                                N:1── employees (supervisor)

workflows ──1:N── workflow_steps

approval_requests ──1:N── approval_steps
                  ──1:N── approval_actions
                  ──1:N── notifications
                  ──1:1── (gate_passes | leave_requests | mrf_requests | purchase_requests)

gate_passes ──N:1── vehicles

departments ──1:N── departments (self-referential parent)

users ──N:M── roles via user_roles
roles ──1:N── permissions

audit_logs ──N:1── users

attachments (polymorphic via entity_type + entity_id)
comments     (polymorphic via entity_type + entity_id)
```

### 2.10 Index Strategy

| Table               | Index                      | Type             | Rationale                            |
| ------------------- | -------------------------- | ---------------- | ------------------------------------ |
| `approval_requests` | `(status)`                 | B-tree           | Filter by status (pending/in_review) |
| `approval_requests` | `(requester_id)`           | B-tree           | My Requests query                    |
| `approval_requests` | `(module_id)`              | B-tree           | Module-specific listing              |
| `approval_requests` | `(control_number)`         | Unique B-tree    | Fast lookup                          |
| `approval_steps`    | `(request_id, actor_id)`   | Composite B-tree | Find approvals for user              |
| `notifications`     | `(recipient_id, is_read)`  | Partial index    | Unread count                         |
| `audit_logs`        | `(entity_type, entity_id)` | Composite B-tree | Entity audit trail                   |
| `audit_logs`        | `(created_at)`             | BRIN             | Time-range queries                   |
| `attachments`       | `(entity_type, entity_id)` | Composite B-tree | Entity attachments                   |
| `comments`          | `(entity_type, entity_id)` | Composite B-tree | Entity comments                      |
| `employee`          | `(department_id)`          | B-tree           | Department lookup                    |
| `employee`          | `(supervisor_id)`          | B-tree           | Team lookup                          |
| `users`             | `(email)`                  | Unique B-tree    | Login                                |
| `vehicles`          | `(plate_number)`           | Unique B-tree    | Lookup                               |
| `assets`            | `(asset_tag)`              | Unique B-tree    | Scan                                 |

---

## 3. Authentication & Authorization

### 3.1 JWT Architecture

```
┌──────────┐          ┌─────────────┐          ┌──────────┐
│  Client  │ ───POST──→  /api/v1/   │ ───verify─→  Users   │
│  (React) │   /login  │  auth/login │  credentials │ Table  │
└──────────┘          └──────┬──────┘          └──────────┘
                             │
                    ┌────────┴────────┐
                    │  Generate Pair  │
                    │  Access Token   │  (15 min)
                    │  Refresh Token  │  (7 days)
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │  Return to      │
                    │  Client         │
                    └─────────────────┘
```

### 3.2 Token Strategy

```typescript
// Access Token (short-lived)
interface AccessTokenPayload {
  sub: string; // user UUID
  emp: string; // employee number
  role: string; // primary role ID
  roles: string[]; // all roles
  dept: string; // department ID
  iat: number;
  exp: number; // 15 minutes
}

// Refresh Token (long-lived, rotated)
interface RefreshTokenPayload {
  sub: string;
  jti: string; // unique token ID
  iat: number;
  exp: number; // 7 days
}
```

### 3.3 RBAC Middleware Flow

```
Request → Auth Middleware → RBAC Middleware → Controller

1. Auth Middleware
   - Extract Bearer token from Authorization header
   - Verify JWT signature (RS256)
   - Decode payload → set req.user
   - If expired → 401 with refresh hint

2. RBAC Middleware (factory function)
   RBAC.require('gate-pass', 'approve')
     ├── Extract module & action from params
     ├── Query permissions table: role_id + module_id
     ├── Check if 'full' or requested action exists
     └── 403 if denied

3. Rate Limiter
   - Per-user: 100 req/min
   - Per-IP: 1000 req/min
   - Login: 5 attempts/15min
```

### 3.4 Password Policy

```typescript
const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  passwordExpiryDays: 90,
  preventReuseCount: 5, // last N hashes stored
  hashRounds: 12, // bcrypt
};
```

---

## 4. REST API Specification

### 4.1 Conventions

```
Base URL:  /api/v1
Format:    JSON
Pagination: ?page=1&limit=25&sort=created_at&order=desc
Filtering: ?status=pending&module_id=gate-pass
Search:    ?q=keyword (searches across text columns)
Errors:    { error: { code: "VALIDATION_ERROR", message: "...", details: [...] } }
Success:   { data: {...}, meta: { total, page, limit } }
```

### 4.2 Endpoint Map

```
AUTH
  POST   /auth/login                          → Login
  POST   /auth/refresh                        → Refresh token
  POST   /auth/logout                         → Invalidate refresh token
  POST   /auth/change-password                → Change password
  POST   /auth/reset-password                 → Request reset
  POST   /auth/reset-password/:token          → Complete reset

USERS
  GET    /users                               → List users (admin)
  GET    /users/:id                           → Get user
  POST   /users                               → Create user
  PATCH  /users/:id                           → Update user
  DELETE /users/:id                           → Deactivate user
  GET    /users/me                            → Current user profile
  PATCH  /users/me                            → Update own profile

ROLES
  GET    /roles                               → List roles
  GET    /roles/:id                           → Get role with permissions
  PATCH  /roles/:id                           → Update role
  GET    /roles/:id/permissions               → Get role permissions
  PUT    /roles/:id/permissions               → Set role permissions (bulk)

DEPARTMENTS
  GET    /departments                         → List departments
  GET    /departments/tree                    → Hierarchical tree
  GET    /departments/:id                     → Get department
  POST   /departments                         → Create department
  PATCH  /departments/:id                     → Update department
  DELETE /departments/:id                     → Delete department

POSITIONS
  GET    /positions                           → List positions
  GET    /positions/:id                       → Get position
  POST   /positions                           → Create position
  PATCH  /positions/:id                       → Update position
  DELETE /positions/:id                       → Delete position

EMPLOYEES
  GET    /employees                           → List employees
  GET    /employees/:id                       → Get employee
  POST   /employees                           → Create employee
  PATCH  /employees/:id                       → Update employee
  DELETE /employees/:id                       → Delete employee
  GET    /employees/:id/team                  → Get subordinates
  GET    /employees/:id/supervisor            → Get supervisor

WORKFLOWS
  GET    /workflows                           → List workflows
  GET    /workflows/:id                       → Get workflow with steps
  POST   /workflows                           → Create workflow
  PATCH  /workflows/:id                       → Update workflow
  DELETE /workflows/:id                       → Delete workflow
  POST   /workflows/:id/duplicate             → Duplicate workflow
  PATCH  /workflows/:id/toggle                → Activate/deactivate
  POST   /workflows/:id/steps                 → Add step
  PATCH  /workflows/:id/steps/:stepId         → Update step
  DELETE /workflows/:id/steps/:stepId         → Remove step
  POST   /workflows/:id/reorder               → Reorder steps

APPROVALS
  GET    /approvals                           → List approvals (filterable)
  GET    /approvals/pending                   → My pending approvals
  GET    /approvals/mine                      → My submitted requests
  GET    /approvals/:id                       → Get approval detail
  POST   /approvals                           → Create approval request
  POST   /approvals/:id/approve               → Approve step
  POST   /approvals/:id/reject                → Reject with reason
  POST   /approvals/:id/return                → Return for revision
  POST   /approvals/:id/delegate              → Delegate to another user
  POST   /approvals/:id/recall                → Recall by requester

DELEGATIONS
  GET    /delegations                         → List delegation rules
  POST   /delegations                         → Create rule
  PATCH  /delegations/:id                     → Update rule
  DELETE /delegations/:id                     → Delete rule
  PATCH  /delegations/:id/toggle              → Enable/disable

NOTIFICATIONS
  GET    /notifications                       → My notifications
  GET    /notifications/unread-count          → Unread count
  PATCH  /notifications/:id/read              → Mark as read
  PATCH  /notifications/read-all              → Mark all as read

NOTIFICATION RULES
  GET    /notification-rules                  → List rules
  POST   /notification-rules                  → Create rule
  PATCH  /notification-rules/:id              → Update rule
  DELETE /notification-rules/:id              → Delete rule

BUSINESS RULES
  GET    /business-rules                      → List rules
  POST   /business-rules                      → Create rule
  PATCH  /business-rules/:id                  → Update rule
  DELETE /business-rules/:id                  → Delete rule
  POST   /business-rules/evaluate             → Evaluate rules against payload

CONTROL NUMBERS
  GET    /control-numbers                     → List series
  PATCH  /control-numbers/:id                 → Update format
  POST   /control-numbers/:id/reset           → Reset sequence

COMPANY
  GET    /company                             → Get profile
  PATCH  /company                             → Update profile

HOLIDAYS
  GET    /holidays                            → List holidays
  POST   /holidays                            → Add holiday
  PATCH  /holidays/:id                        → Update holiday
  DELETE /holidays/:id                        → Delete holiday
  GET    /holidays/is-business-day?date=      → Check if business day

SETTINGS
  GET    /settings                            → List settings
  GET    /settings/:category                  → Settings by category
  PATCH  /settings/:key                       → Update setting

AUDIT LOGS
  GET    /audit-logs                          → List logs (admin)
  GET    /audit-logs/:entity-type/:entity-id  → Logs for entity

ATTACHMENTS
  POST   /attachments/upload                  → Upload file
  GET    /attachments/:entity-type/:entity-id → Get entity attachments
  DELETE /attachments/:id                     → Delete attachment

COMMENTS
  GET    /comments/:entity-type/:entity-id    → Get entity comments
  POST   /comments/:entity-type/:entity-id    → Add comment
  PATCH  /comments/:id                        → Edit comment
  DELETE /comments/:id                        → Delete comment

DASHBOARD
  GET    /dashboard/overview                  → KPI cards data
  GET    /dashboard/metrics                   → Approval metrics
  GET    /dashboard/charts                    → Chart data

SEARCH
  GET    /search?q=keyword                    → Global search

MODULE-SPECIFIC (Gate Pass, Leave, MRF, Purchase Request, Visitors, Vehicles, Assets)
  Each module follows the same CRUD pattern:
  GET    /{module}                            → List
  GET    /{module}/:id                        → Get detail
  POST   /{module}                            → Create
  PATCH  /{module}/:id                        → Update
  DELETE /{module}/:id                        → Delete
  GET    /{module}/:id/print                  → Print layout data
```

### 4.3 Example Request/Response

```typescript
// POST /api/v1/approvals/:id/approve
// Request
{
  "note": "All documents verified. Approved.",
  "actorId": "uuid-of-approver"
}

// Response 200
{
  "data": {
    "id": "apr-uuid",
    "controlNumber": "GP-2026-000483",
    "status": "in_review",
    "currentStepIndex": 3,
    "steps": [...]
  },
  "meta": null
}

// Error Response 400
{
  "error": {
    "code": "INVALID_STEP",
    "message": "This step is not currently awaiting approval",
    "details": [
      { "field": "status", "reason": "Step is already marked as 'approved'" }
    ]
  }
}

// Paginated List Response
// GET /api/v1/approvals/pending?page=1&limit=10
{
  "data": [...],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 5. Service Layer Architecture

### 5.1 Layer Responsibilities

```
Controller (HTTP)
  │
  ├── Parse & validate request (DTO + class-validator)
  ├── Call Use Case
  └── Format response (ApiResponse)

Use Case (Application)
  │
  ├── Business logic / orchestration
  ├── Call Repository (interface)
  ├── Call Services (notification, audit, etc.)
  ├── Manage transaction boundaries
  └── Raise domain events

Repository (Infrastructure)
  │
  ├── Prisma ORM queries
  ├── No business logic
  ├── Return domain entities
  └── Handle row→entity mapping

Service (Infrastructure)
  │
  ├── Email, SMS, File Storage, Queue
  ├── External API calls
  └── No business logic
```

### 5.2 Use Case Example

```typescript
// src/application/approval/approve-request.usecase.ts

export class ApproveRequestUseCase {
  constructor(
    private readonly approvalRepo: IApprovalRepository,
    private readonly workflowRepo: IWorkflowRepository,
    private readonly notificationService: INotificationService,
    private readonly auditService: IAuditService,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(dto: ApproveRequestDto): Promise<ApprovalRequest> {
    // Prisma handles transactions natively
    return this.prisma.$transaction(async (tx) => {
      // 1. Load the request with lock
      const request = await this.approvalRepo.findByIdForUpdate(dto.requestId, tx);
      if (!request) throw new NotFoundError("Approval request not found");

      // 2. Validate current step
      const step = request.getCurrentStep();
      if (!step || step.status !== "current") {
        throw new ValidationError("Step is not awaiting approval");
      }

      // 3. Validate actor permissions
      const hasPermission = await this.workflowRepo.canUserApproveStep(dto.actorId, step.id, tx);
      if (!hasPermission) throw new ForbiddenError("Not authorized to approve this step");

      // 4. Approve the step
      step.approve(dto.actorId, dto.note);
      request.advanceToNextStep();

      // 5. Check business rules for dynamic routing
      const rules = await this.workflowRepo.evaluateBusinessRules(
        request.moduleId,
        request.metadata,
        tx,
      );
      if (rules.length > 0) {
        request.applyBusinessRules(rules);
      }

      // 6. Save
      await this.approvalRepo.save(request, tx);
      await this.approvalRepo.logAction(
        {
          requestId: request.id,
          stepId: step.id,
          action: "approve",
          actorId: dto.actorId,
          note: dto.note,
        },
        tx,
      );

      // 7. Notify next approver (async, non-blocking)
      const nextStep = request.getCurrentStep();
      if (nextStep) {
        await this.notificationService.notifyApprovalRequired(nextStep, request, tx);
      }

      // 8. Audit
      await this.auditService.log(
        {
          actorId: dto.actorId,
          action: "approve",
          entityType: "approval_request",
          entityId: request.id,
          changes: { step: step.name, status: "approved" },
        },
        tx,
      );

      return request;
    });
  }
}
```

### 5.3 Prisma Transaction Pattern

```typescript
// src/infrastructure/database/prisma.service.ts

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
});

// Usage in repositories:
export class UserRepository {
  async findById(id: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = tx ?? prisma;
    const record = await client.user.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  private toDomain(record: PrismaUser): User {
    return new User({
      id: record.id,
      employeeId: record.employeeId,
      email: record.email,
      // ... map all fields
    });
  }
}
```

---

## 6. Audit Engine

### 6.1 Architecture

```
Controller → Use Case → Audit Service → Database
                            │
                    ┌───────┴───────┐
                    │  async queue  │  (non-blocking)
                    └───────────────┘
```

### 6.2 Audit Strategy

```typescript
// Every mutation records:
interface AuditEntry {
  actorId: string; // Who did it
  action: string; // What: create, update, delete, approve, reject, login
  entityType: string; // What kind: gate_pass, approval, user, role
  entityId: string; // Which record
  changes?: {
    // Before/after diff
    before: Record<string, unknown>;
    after: Record<string, unknown>;
    diff: Record<string, { from: unknown; to: unknown }>;
  };
  ipAddress?: string;
  userAgent?: string;
}

// Sensitive fields masked in audit:
const SENSITIVE_FIELDS = ["password_hash", "two_factor_secret", "token"];
// These are excluded from diff or stored as '[REDACTED]'
```

### 6.3 Audit Log Queries

```sql
-- Recent activity for a specific request
SELECT * FROM audit_logs
WHERE entity_type = 'approval_request' AND entity_id = $1
ORDER BY created_at DESC;

-- User activity timeline
SELECT * FROM audit_logs
WHERE actor_id = $1
ORDER BY created_at DESC
LIMIT 50;

-- Module activity summary (for dashboard)
SELECT entity_type, action, COUNT(*) as count
FROM audit_logs
WHERE created_at >= now() - interval '30 days'
GROUP BY entity_type, action;
```

---

## 7. Notification Service

### 7.1 Architecture

```
Trigger Event → Event Bus → Notification Service
                                │
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
              Notification   Email Queue  SMS Queue
              Table          (Bull/bullmq)  (future)
                    │
                    ↓
              In-App Notification
              (Polled by frontend)
```

### 7.2 Delivery Strategy

```typescript
interface NotificationChannel {
  send(notification: NotificationPayload): Promise<void>;
}

class InAppChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    // INSERT INTO notifications (recipient, title, message, ...)
    // Frontend polls GET /notifications/unread-count every 30s
  }
}

class EmailChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    // Enqueue to Bull queue with retry
    // email-worker.ts processes queue, sends via nodemailer
    // Templates stored in database (notification_rules)
  }
}
```

### 7.3 Notification Engine Flow

```
1. Event occurs (e.g., gate pass submitted)
2. Load matching notification rules (module_id + event)
3. Resolve recipients (roles → users)
4. Render template (replace {{variables}})
5. Dispatch to each active channel
6. Record in notifications table
```

---

## 8. File Storage Strategy

### 8.1 Storage Adapters

```typescript
interface FileStorageAdapter {
  upload(filename: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(storagePath: string): Promise<Buffer>;
  delete(storagePath: string): Promise<void>;
  getSignedUrl(storagePath: string, expiresIn?: number): Promise<string>;
}

class LocalStorageAdapter implements FileStorageAdapter {
  // Base path: ./uploads/{entity_type}/{yyyy}/{mm}/{uuid}-{filename}
  // Suitable for development and on-premise deployment
}

class S3StorageAdapter implements FileStorageAdapter {
  // Bucket: hst-portal-{env}
  // Path: {entity_type}/{yyyy}/{mm}/{uuid}-{filename}
  // Future: migrate to MinIO (self-hosted S3-compatible)
}
```

### 8.2 File Upload Flow

```
POST /attachments/upload
  └── multipart/form-data
      ├── file (binary)
      ├── entity_type: "gate_pass"
      └── entity_id: "uuid-or-null"

  1. Validate file type & size (max 10MB)
  2. Scan for malware (future)
  3. Generate storage path
  4. Upload to storage adapter
  5. INSERT INTO attachments metadata
  6. Return attachment record
```

### 8.3 Local Storage Structure

```
/uploads/
├── gate-pass/
│   ├── 2026/
│   │   ├── 01/
│   │   └── 02/
│   └── ...
├── leave/
├── mrf/
├── purchase/
├── visitors/
├── assets/
└── profile/
```

---

## 9. Background Jobs & Escalation

### 9.1 Job Queue (Bull/BullMQ)

```typescript
// Queue definitions
const queues = {
  escalations: new Queue("escalations"), // Check timed-out approvals
  reminders: new Queue("reminders"), // Send approval reminders
  notifications: new Queue("notifications"), // Process notification delivery
  email: new Queue("email"), // Send emails
  audit: new Queue("audit"), // Bulk audit log writes
  controlNumbers: new Queue("control-numbers"), // Sequence number generation
};
```

### 9.2 Escalation Job

```typescript
// Runs every 5 minutes
// EscalationJob.ts
async function checkEscalations() {
  // 1. Query approval_steps where status = 'current'
  //    AND assigned_at + COALESCE(escalation_hours, 48) < now()
  //    AND escalated = false
  //
  // 2. For each matched step:
  //    a. Mark as escalated
  //    b. Find the escalation target role/user
  //    c. Escalate to that role/user
  //    d. Send notifications
  //    e. Audit log
  //
  // 3. Optionally send reminder 1 hour before escalation
}
```

### 9.3 Reminder Job

```typescript
// Runs every hour
// ReminderJob.ts
async function sendReminders() {
  // 1. Query approval_steps where status = 'current'
  //    AND assigned_at < now() - interval '24 hours'
  //    AND no reminder sent in last 24h
  //
  // 2. Send in-app notification to current approver
}
```

### 9.4 Scheduled Jobs Summary

| Job                    | Interval   | Purpose                              |
| ---------------------- | ---------- | ------------------------------------ |
| `escalations`          | 5 min      | Check and process step timeouts      |
| `reminders`            | 60 min     | Send approval reminders              |
| `email-queue`          | continuous | Process email delivery queue         |
| `notification-cleanup` | 24 h       | Archive old notifications (>90 days) |
| `audit-archive`        | 24 h       | Archive audit logs (>365 days)       |
| `token-cleanup`        | 24 h       | Remove expired refresh tokens        |
| `leave-credit-accrual` | 24 h       | Accrue leave credits (monthly)       |
| `backup`               | 24 h       | Database backup                      |

---

## 10. Error Handling & Transactions

### 10.1 Error Classes

```typescript
// Base error
class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Specific errors
class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    super(404, "NOT_FOUND", `${entity}${id ? ` ${id}` : ""} not found`);
  }
}

class ValidationError extends AppError {
  constructor(details: { field: string; reason: string }[]) {
    super(400, "VALIDATION_ERROR", "Validation failed", details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(403, "FORBIDDEN", message);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(409, "CONFLICT", message);
  }
}
```

### 10.2 Transaction Boundaries

```typescript
// A single use case = one transaction
class ApproveRequestUseCase {
  async execute(dto: ApproveRequestDto): Promise<ApprovalRequest> {
    return this.prisma.$transaction(async (tx) => {
      // All repository calls must use the same tx
      const request = await this.approvalRepo.findById(dto.requestId, tx);
      // ... business logic ...
      await this.approvalRepo.save(request, tx);
      await this.approvalRepo.logAction(action, tx);
      // Notifications and audit happen AFTER commit (eventually consistent)
      return request;
    });
  }
}

// After commit, dispatch async events
class EventDispatcher {
  async dispatchAfterCommit(events: DomainEvent[]): Promise<void> {
    // Use setImmediate or Bull queue to fire events
    // after the transaction has committed
  }
}
```

### 10.3 Error Response Format

```json
// 400 Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "amount", "reason": "Amount must be greater than 0" },
      { "field": "description", "reason": "Description is required" }
    ]
  }
}

// 404 Not Found
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Approval request apr-xxx not found"
  }
}

// 500 Internal Server Error (never expose stack trace)
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## 11. API Documentation (OpenAPI)

### 11.1 Specification (swagger.yaml excerpt)

```yaml
openapi: "3.0.3"
info:
  title: HST Enterprise Portal API
  version: "1.0.0"
  description: |
    Enterprise Resource Planning API for HST Technologies.
    Covers all operational modules: Gate Pass, Leave, MRF,
    Purchase Request, Visitors, Vehicles, Assets.

servers:
  - url: https://api.hst-corp.com/api/v1
    description: Production
  - url: https://staging-api.hst-corp.com/api/v1
    description: Staging

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    ApprovalRequest:
      type: object
      properties:
        id:
          type: string
          format: uuid
        controlNumber:
          type: string
          example: "GP-2026-000483"
        moduleId:
          type: string
          enum: [gate-pass, leave, mrf, purchase-request]
        title:
          type: string
        status:
          type: string
          enum: [draft, pending, in_review, approved, rejected, returned, cancelled]
        currentStep:
          $ref: "#/components/schemas/ApprovalStep"
        steps:
          type: array
          items:
            $ref: "#/components/schemas/ApprovalStep"
        createdAt:
          type: string
          format: date-time

paths:
  /approvals/pending:
    get:
      summary: Get pending approvals for current user
      security:
        - BearerAuth: []
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
        - in: query
          name: limit
          schema:
            type: integer
            default: 25
      responses:
        "200":
          description: List of pending approvals
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: "#/components/schemas/ApprovalRequest"
                  meta:
                    $ref: "#/components/schemas/PaginationMeta"

  /approvals/{id}/approve:
    post:
      summary: Approve the current step
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                note:
                  type: string
                  maxLength: 1000
      responses:
        "200":
          description: Step approved
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/ApprovalRequest"
        "400":
          description: Validation error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ApiError"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
```

---

## 12. Module Functional Completion (Phase 5.5)

Each module needs unique business logic beyond the shared approval framework:

### Gate Pass

- Company Vehicle → Vehicle Coordinator step (business rule)
- QR Code generation for security scanning
- Security release flow (guard scans QR, confirms items match)
- Return time tracking
- Print layout matching HST paper forms
- GPS destination tracking (future)
- Vehicle log auto-population

### Leave

- Leave balance tracking per employee per fiscal year
- Leave credit accrual rules (monthly/annually)
- Holiday exclusion from leave days
- Half-day requests (AM/PM)
- Leave calendar view
- Carry-over rules
- Sick leave doctor's note requirement

### MRF

- Position & department selection
- Required skills (tag-based)
- Headcount vs. budget validation
- Recruitment pipeline tracking (future)
- Salary range validation
- Employment type determination

### Purchase Request

- Supplier management
- Budget validation against cost center
- Quotation attachment requirement
- Amount-based routing (business rule)
- Capital vs. operating expense
- Payment terms
- Delivery scheduling

### Visitors

- Visitor badge/QR code generation
- Host employee notification
- NDA acknowledgment workflow
- Check-in / Check-out kiosk
- Vehicle plate entry
- Purpose categorization
- Pre-registration approval

### Vehicles

- Reservation calendar
- Maintenance scheduling & alerts
- Fuel log tracking
- Driver assignment
- Odometer tracking
- GPS integration (future)
- Cost per kilometer

### Assets

- Barcode / QR code generation
- Asset lifecycle tracking (acquire → assign → maintain → dispose)
- Borrow & Return workflow
- Maintenance history
- Depreciation calculation
- Location tracking
- Audit trail for every transaction

---

## Appendices

### A. Technology Choices

| Component      | Choice                                     | Rationale                                                                     |
| -------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| Runtime        | Node.js 20 LTS                             | Team familiarity, async I/O                                                   |
| Framework      | Express.js (Fastify if performance needed) | Large ecosystem, easy to maintain                                             |
| Database       | PostgreSQL 16                              | Mature, JSONB, array types, full-text search                                  |
| ORM            | Prisma ORM                                 | Type-safe, auto-generated client, migrations, integrates well with TypeScript |
| Validation     | `zod`                                      | TypeScript-first, composable schemas                                          |
| Auth           | `jsonwebtoken` + `bcrypt`                  | Standard JWT, bcrypt for passwords                                            |
| Queue          | BullMQ (Redis)                             | Persistent, scheduled, retry                                                  |
| Email          | Nodemailer                                 | SMTP, template support                                                        |
| File Upload    | Multer                                     | Multipart form handling                                                       |
| File Storage   | Local filesystem (`/uploads`)              | On-premise, no cloud dependency                                               |
| Scheduled Jobs | node-cron                                  | Lightweight, no Redis dependency for basic scheduling                         |
| API Docs       | Swagger/OpenAPI 3.x                        | Auto-generated from zod schemas                                               |
| Testing        | Vitest + Supertest                         | Fast, TypeScript-native                                                       |
| Monitoring     | Application logs + Audit logs              | Built-in, no external dependency                                              |

### B. Performance Targets

| Metric                     | Target  |
| -------------------------- | ------- |
| API response time (p95)    | < 200ms |
| Approval action latency    | < 500ms |
| Database query time (p99)  | < 100ms |
| Concurrent connections     | 500     |
| Daily request capacity     | 100,000 |
| Upload max file size       | 10 MB   |
| Eventual consistency delay | < 5s    |

### C. Security Checklist

- [ ] JWT signed with RS256 (private/public key pair)
- [ ] Access token TTL: 15 minutes
- [ ] Refresh token TTL: 7 days (rotated on use)
- [ ] Refresh tokens stored in DB for revocation
- [ ] Password hashing: bcrypt with 12 rounds
- [ ] Rate limiting: 100 req/min per user
- [ ] CORS restricted to known origins
- [ ] SQL injection prevented via Prisma ORM (parameterized queries)
- [ ] XSS prevented via Content-Type enforcement
- [ ] CSRF via SameSite cookies + token header
- [ ] File upload: MIME validation + size limits
- [ ] Audit logging for all data mutations
- [ ] HTTPS enforced (TLS 1.3) via Cloudflare
- [ ] Secrets via environment variables (not in code)

### D. Infrastructure Summary

| Component     | Configuration                                              |
| ------------- | ---------------------------------------------------------- |
| Domain & DNS  | Cloudflare (Free) — DNS management, HTTPS, DDoS protection |
| Reverse Proxy | Nginx — SSL termination, compression, routing              |
| Hosting       | Local Windows Server or Ubuntu Server (On-Premise)         |
| Network       | Local LAN + VPN (Optional for remote access)               |
| SSL           | Cloudflare Origin Certificate                              |
| Database Host | Local PostgreSQL server                                    |
| File Storage  | Local `/uploads` directory                                 |
| Backup        | Daily PostgreSQL backup scripts                            |

### E. Suggested Server Specifications (100–300 users)

| Component      | Recommended                           |
| -------------- | ------------------------------------- |
| CPU            | Intel Xeon / Intel Core i7 (8+ cores) |
| RAM            | 32 GB                                 |
| Storage        | 1 TB NVMe SSD                         |
| Database Drive | Separate SSD if possible              |
| Backup Drive   | External HDD or NAS                   |
| Network        | Gigabit Ethernet                      |

---

## 13. Environment Strategy

The HST Enterprise Portal follows a four-environment deployment model:

| Environment                       | Purpose                      | URL Pattern                    | Data                                           |
| --------------------------------- | ---------------------------- | ------------------------------ | ---------------------------------------------- |
| **Development**                   | Developer machines           | `localhost:5173`               | Local PostgreSQL, seeded test data             |
| **Local Server Testing**          | Internal QA, power users     | `http://hst-portal-test.local` | Test database, anonymized production-like data |
| **UAT (User Acceptance Testing)** | Department testing, training | `https://uat.hst-corp.com`     | Staging database, production-like data         |
| **Production**                    | Live ERP for all employees   | `https://hst-corp.com`         | Production PostgreSQL, live data               |

### Environment Configuration

Each environment is controlled by `.env` files:

```
.env.development
.env.testing
.env.uat
.env.production
```

### Promotion Flow

```
Development → Local Testing → UAT → Production
     ↓              ↓             ↓          ↓
  Developer      QA Team      Department   Live
  commits        testing       sign-off    release
```

### Branching Strategy

| Branch      | Environment | Purpose                                 |
| ----------- | ----------- | --------------------------------------- |
| `main`      | Production  | Stable, deployable code                 |
| `develop`   | UAT         | Integration branch for upcoming release |
| `feature/*` | Development | New features                            |
| `hotfix/*`  | Production  | Emergency fixes                         |

---

## 14. Backup & Disaster Recovery

### 14.1 PostgreSQL Backup Strategy

| Frequency   | Method                           | Retention | Purpose                                     |
| ----------- | -------------------------------- | --------- | ------------------------------------------- |
| **Daily**   | `pg_dump` (custom format)        | 7 days    | Point-in-time recovery for recent data loss |
| **Weekly**  | Full base backup + WAL archiving | 4 weeks   | Recovery from logical corruption            |
| **Monthly** | Compressed archive               | 12 months | Compliance, long-term retention             |

### 14.2 Backup Script Example

```bash
#!/bin/bash
# /scripts/backup-postgres.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="hst_portal"

# Daily dump
pg_dump -Fc -U postgres -d $DB_NAME -f "$BACKUP_DIR/daily/$DB_NAME-$DATE.dump"

# Retain only last 7 daily backups
find "$BACKUP_DIR/daily" -name "*.dump" -mtime +7 -delete

# Weekly backup (every Sunday)
if [ $(date +%u) -eq 7 ]; then
  pg_dump -Fc -U postgres -d $DB_NAME -f "$BACKUP_DIR/weekly/$DB_NAME-$DATE.dump"
  find "$BACKUP_DIR/weekly" -name "*.dump" -mtime +28 -delete
fi

# Monthly backup (1st of month)
if [ $(date +%d) -eq 01 ]; then
  pg_dump -Fc -U postgres -d $DB_NAME -f "$BACKUP_DIR/monthly/$DB_NAME-$DATE.dump"
  find "$BACKUP_DIR/monthly" -name "*.dump" -mtime +365 -delete
fi
```

### 14.3 File Upload Backup

| Frequency   | Method                               | Retention |
| ----------- | ------------------------------------ | --------- |
| **Daily**   | `robocopy` / `rsync` to backup drive | 7 days    |
| **Weekly**  | Full `/uploads` copy                 | 4 weeks   |
| **Monthly** | Compressed archive                   | 12 months |

### 14.4 Disaster Recovery Plan

| Scenario                    | Recovery Steps                                | RTO     | RPO      |
| --------------------------- | --------------------------------------------- | ------- | -------- |
| **Single table corruption** | Restore from daily backup + replay WAL        | 1 hour  | 24 hours |
| **Full database loss**      | Restore from weekly backup + daily WAL replay | 4 hours | 1 week   |
| **Server hardware failure** | Restore from latest backup to new server      | 8 hours | 24 hours |
| **File storage loss**       | Restore from weekly file backup               | 4 hours | 1 week   |

**RTO** = Recovery Time Objective  
**RPO** = Recovery Point Objective

---

## 15. API Versioning Strategy

### 15.1 URL Path Versioning

All API endpoints are versioned via the URL path:

```
/api/v1/auth/login
/api/v1/users
/api/v1/gate-pass
/api/v1/approvals
```

### 15.2 Version Lifecycle

| Version            | Status     | Support                                          |
| ------------------ | ---------- | ------------------------------------------------ |
| `/api/v1`          | Current    | Full support, active development                 |
| `/api/v1` (legacy) | Deprecated | Security fixes only for 6 months after v2 launch |
| `/api/v2`          | Future     | Planned for major breaking changes               |

### 15.3 Versioning Rules

- **Breaking changes** require a new version (e.g., removing a field, changing response structure).
- **Non-breaking changes** (new endpoints, new optional fields) do not require a new version.
- **Deprecation** — Old versions are supported for at least 6 months before removal.
- **Frontend compatibility** — Frontend must specify API version in all requests.

### 15.4 Example Breaking vs. Non-Breaking

| Change                             | Version Bump? |
| ---------------------------------- | ------------- |
| Add new optional field to response | No            |
| Add new endpoint                   | No            |
| Remove field from response         | Yes           |
| Rename field                       | Yes           |
| Change field type                  | Yes           |
| Change authentication mechanism    | Yes           |

---

## 16. Logging Strategy

### 16.1 Log Types

| Log Type             | Destination                     | Purpose                                                       | Retention            |
| -------------------- | ------------------------------- | ------------------------------------------------------------- | -------------------- |
| **Application Logs** | File system (`/logs/app/`)      | Startup, shutdown, errors, warnings                           | 30 days              |
| **API Logs**         | File system (`/logs/api/`)      | Request/response metadata (method, path, status, duration)    | 30 days              |
| **Database Logs**    | PostgreSQL `log_directory`      | Slow queries, connection errors, deadlocks                    | 7 days               |
| **Audit Logs**       | PostgreSQL `audit_logs` table   | User actions (create, update, delete, approve, reject, login) | 7 years (compliance) |
| **Security Logs**    | File system (`/logs/security/`) | Failed logins, RBAC denials, rate limit hits                  | 1 year               |

### 16.2 Log Format (Structured JSON)

```json
{
  "timestamp": "2026-07-09T22:15:00.000Z",
  "level": "info",
  "service": "hst-portal-api",
  "environment": "production",
  "message": "User logged in successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "employeeNumber": "HS2606-1980",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "duration": 45,
  "requestId": "req-abc123"
}
```

### 16.3 What to Log

**Application Logs:**

- Server startup/shutdown
- Unhandled exceptions
- Configuration errors
- External service failures (email, SMS)

**API Logs:**

- HTTP method, path, status code
- Response time (p95, p99 monitoring)
- Request size, response size
- User ID (if authenticated)

**Audit Logs (Database):**

- All CRUD operations on business entities
- Approval actions (approve, reject, return, delegate, recall)
- Authentication events (login, logout, password change)
- Configuration changes (workflow edits, role changes)
- Before/after values for updates

**Security Logs:**

- Failed login attempts (with IP)
- RBAC denials (user, resource, action)
- Rate limit triggers
- Token refresh failures

### 16.4 What NOT to Log

- Passwords (plaintext or hashed)
- JWT tokens (access or refresh)
- Full request/response bodies containing PII
- Credit card numbers (if ever added)
- Session tokens

---

## 17. Error Code Standard

### 17.1 Error Code Format

```
{MODULE}-{NUMBER}
```

- **MODULE** — 2-3 letter module identifier (AUTH, GP, LV, MRF, PR, VIS, VEH, AST, SYS)
- **NUMBER** — Sequential 3-digit number

### 17.2 Error Code Registry

| Code         | Meaning                               | HTTP Status |
| ------------ | ------------------------------------- | ----------- |
| **AUTH-001** | Invalid credentials                   | 401         |
| **AUTH-002** | Account locked                        | 403         |
| **AUTH-003** | Token expired                         | 401         |
| **AUTH-004** | Invalid refresh token                 | 401         |
| **AUTH-005** | Password policy violation             | 400         |
| **GP-001**   | Gate Pass not found                   | 404         |
| **GP-002**   | Workflow not configured for Gate Pass | 400         |
| **GP-003**   | Security release already completed    | 400         |
| **LV-001**   | Insufficient leave credits            | 400         |
| **LV-002**   | Leave overlaps with holiday           | 400         |
| **LV-003**   | Leave balance not found               | 404         |
| **MRF-001**  | Position not found                    | 404         |
| **MRF-002**  | Budget validation failed              | 400         |
| **PR-001**   | Supplier not approved                 | 400         |
| **PR-002**   | Budget exceeded                       | 400         |
| **VIS-001**  | Visitor not found                     | 404         |
| **VIS-002**  | NDA not signed                        | 400         |
| **VEH-001**  | Vehicle not available                 | 400         |
| **VEH-002**  | Maintenance overdue                   | 400         |
| **AST-001**  | Asset not found                       | 404         |
| **AST-002**  | Asset already assigned                | 400         |
| **WF-001**   | Invalid workflow step                 | 400         |
| **WF-002**   | Workflow version mismatch             | 409         |
| **SYS-001**  | Internal server error                 | 500         |
| **SYS-002**  | Database connection error             | 503         |
| **SYS-003**  | Service unavailable                   | 503         |

### 17.3 Usage in Responses

```json
{
  "error": {
    "code": "GP-002",
    "message": "No active workflow found for Gate Pass module. Contact administrator.",
    "details": [
      {
        "field": "moduleId",
        "reason": "Workflow configuration missing"
      }
    ]
  }
}
```

---

## 18. API Response Standard

### 18.1 Success Response

```json
{
  "success": true,
  "message": "Gate Pass created successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "controlNumber": "GP-2026-000483",
    "status": "pending"
  },
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 25
  },
  "errors": null
}
```

### 18.2 Error Response

```json
{
  "success": false,
  "message": "Validation failed.",
  "data": null,
  "meta": null,
  "errors": [
    {
      "field": "purpose",
      "message": "Purpose is required.",
      "code": "REQUIRED_FIELD"
    },
    {
      "field": "destination",
      "message": "Destination must be at least 10 characters.",
      "code": "MIN_LENGTH"
    }
  ]
}
```

### 18.3 Paginated List Response

```json
{
  "success": true,
  "message": "Gate Passes retrieved successfully.",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "controlNumber": "GP-2026-000483",
      "status": "pending"
    }
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 25,
    "totalPages": 2
  },
  "errors": null
}
```

### 18.4 Empty Response

```json
{
  "success": true,
  "message": "No pending approvals found.",
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 25,
    "totalPages": 0
  },
  "errors": null
}
```

### 18.5 Response Standards

- **Always** include `success`, `message`, `data`, `meta`, `errors` fields.
- `success` is a boolean — never omit it.
- `message` is a human-readable string describing the result.
- `data` contains the payload (object, array, or null).
- `meta` contains pagination metadata (omit for non-list responses).
- `errors` is an array of error objects or null.

---

## 19. Alternative Folder Structure (Module-Based)

The blueprint's Section 1 proposes a layer-based structure (domain, application, infrastructure, interfaces). For teams that prefer feature cohesion, a module-based structure is an alternative:

```
backend/
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.dto.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── auth.routes.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.dto.ts
│   │   │   └── users.routes.ts
│   │   │
│   │   ├── gate-pass/
│   │   │   ├── gate-pass.module.ts
│   │   │   ├── gate-pass.controller.ts
│   │   │   ├── gate-pass.service.ts
│   │   │   ├── gate-pass.repository.ts
│   │   │   ├── gate-pass.dto.ts
│   │   │   ├── gate-pass.workflow.ts
│   │   │   └── gate-pass.routes.ts
│   │   │
│   │   ├── leave/
│   │   ├── mrf/
│   │   ├── purchase/
│   │   ├── visitor/
│   │   ├── vehicle/
│   │   └── asset/
│   │
│   ├── shared/
│   │   ├── database/
│   │   │   └── prisma.service.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── rbac.ts
│   │   │   ├── validator.ts
│   │   │   ├── error-handler.ts
│   │   │   ├── request-logger.ts
│   │   │   └── rate-limiter.ts
│   │   ├── security/
│   │   │   ├── jwt.service.ts
│   │   │   ├── bcrypt.service.ts
│   │   │   └── rbac.middleware.ts
│   │   ├── notifications/
│   │   │   ├── notification.service.ts
│   │   │   ├── email.service.ts
│   │   │   ├── in-app.service.ts
│   │   │   └── notification-queue.ts
│   │   ├── workflow/
│   │   │   ├── workflow.engine.ts
│   │   │   ├── approval.service.ts
│   │   │   ├── delegation.service.ts
│   │   │   └── business-rules.service.ts
│   │   ├── audit/
│   │   │   └── audit.service.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── crypto.ts
│   │       └── slug.ts
│   │
│   ├── errors/
│   │   ├── app-error.ts
│   │   ├── not-found.error.ts
│   │   ├── validation.error.ts
│   │   ├── unauthorized.error.ts
│   │   └── forbidden.error.ts
│   │
│   └── types/
│       ├── pagination.ts
│       ├── api-response.ts
│       └── request-context.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/
├── docs/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

### When to Use Module-Based Structure

- **Smaller teams** (2-5 backend developers) — Easier to navigate, all code for a feature in one place.
- **Feature-focused development** — Developers work on one module at a time.
- **Faster onboarding** — New developers understand one module before learning the whole system.

### When to Use Layer-Based Structure (Original)

- **Larger teams** (6+ backend developers) — Clear separation of concerns reduces merge conflicts.
- **Cross-cutting concerns** — Shared services (audit, notifications) are centralized.
- **Domain-driven design** — Entities and business logic are isolated from infrastructure.

**Recommendation:** Start with the **layer-based structure** (Section 1) for the initial backend implementation. Refactor to module-based if the team grows or if feature cohesion becomes a pain point.

---

## 20. Future Integration Roadmap

The following integrations are reserved for future phases. They are documented here to ensure the database schema and API design accommodate them without breaking changes.

### 20.1 Identity & Access

| Integration                 | Purpose                                                        | Priority | Notes                                                                       |
| --------------------------- | -------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| **Active Directory / LDAP** | Sync users, departments, positions from corporate directory    | High     | Add `external_id` column to `users` table; support LDAP bind authentication |
| **Microsoft 365**           | Calendar integration for leave scheduling, email via Graph API | Medium   | Add `m365_*` columns to `users` table                                       |
| **Google Workspace**        | Alternative to M365 for email/calendar                         | Low      | Same as M365 — abstract email service behind interface                      |

### 20.2 Hardware & IoT

| Integration               | Purpose                                                 | Priority | Notes                                                           |
| ------------------------- | ------------------------------------------------------- | -------- | --------------------------------------------------------------- |
| **Biometric Attendance**  | Sync leave balances with biometric logs                 | Medium   | Add `attendance_device_id` to `employees` table                 |
| **Barcode / QR Scanners** | Asset tracking, gate pass security release              | High     | QR codes already in schema; scanner API endpoint needed         |
| **GPS Tracking**          | Vehicle location, geofencing for gate pass destinations | Low      | Add `gps_device_id` to `vehicles` table; async location updates |

### 20.3 Communication

| Integration            | Purpose                                                 | Priority | Notes                                                            |
| ---------------------- | ------------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| **SMS Gateway**        | OTP, approval reminders, escalation alerts              | Medium   | Extend `notifications` table with `sms` channel; add SMS adapter |
| **Email SMTP**         | Transactional emails (approval notifications, payslips) | High     | Already planned via Nodemailer                                   |
| **Push Notifications** | Mobile app notifications (future)                       | Low      | Requires mobile app; add `push_token` to `users` table           |

### 20.4 ERP Integrations

| Integration             | Purpose                                                 | Priority | Notes                                                          |
| ----------------------- | ------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| **SAP Export**          | Financial data sync (purchase requests, assets)         | Medium   | Add `sap_sync_status` to relevant tables; scheduled export job |
| **Excel Import/Export** | Bulk data operations (employee import, asset inventory) | High     | Add `/api/v1/import` and `/api/v1/export` endpoints            |
| **Payroll System**      | Leave deductions, overtime calculations                 | Low      | Add `payroll_sync_status` to `leave_requests` table            |

### 20.5 Infrastructure

| Integration              | Purpose                                        | Priority | Notes                                                     |
| ------------------------ | ---------------------------------------------- | -------- | --------------------------------------------------------- |
| **Redis**                | Caching, session storage, BullMQ queue backend | Medium   | Add when concurrent users exceed 200 or email queue grows |
| **Elasticsearch**        | Full-text search across all modules            | Low      | Add `/api/v1/search` endpoint with Elasticsearch backend  |
| **Prometheus + Grafana** | Metrics, dashboards, alerting                  | Low      | Export application metrics for monitoring                 |

---

## 21. Release Strategy

### 21.1 Versioning Scheme

The project follows **Semantic Versioning** (SemVer):

```
MAJOR.MINOR.PATCH

v1.0.0 — Initial production release
v1.1.0 — New module (Vehicles)
v1.1.1 — Bug fix (Leave balance calculation)
v2.0.0 — Breaking API changes
```

### 21.2 Release Phases

| Phase                       | Version | Purpose                                     | Duration  | Audience         |
| --------------------------- | ------- | ------------------------------------------- | --------- | ---------------- |
| **Prototype**               | v0.1.x  | Core workflow proof-of-concept              | 2-4 weeks | Development team |
| **Internal Testing**        | v0.5.x  | Single module (Gate Pass) tested internally | 4-6 weeks | QA, Power users  |
| **User Acceptance Testing** | v0.9.x  | All modules, UAT environment                | 6-8 weeks | Department heads |
| **Production**              | v1.0.0  | Live ERP for all employees                  | Ongoing   | All employees    |
| **Maintenance**             | v1.x.x  | Bug fixes, minor features                   | Ongoing   | All employees    |
| **Major Release**           | v2.0.0  | New architecture, breaking changes          | As needed | All employees    |

### 21.3 Release Checklist

Before each production release:

- [ ] All UAT test cases passed
- [ ] Performance benchmarks met (p95 < 200ms)
- [ ] Security checklist completed (Appendix C)
- [ ] Database migration tested on staging
- [ ] Backup strategy verified
- [ ] Rollback plan documented
- [ ] Release notes prepared
- [ ] User training materials updated
- [ ] Deployment guide reviewed

### 21.4 Rollback Strategy

If a production release fails:

1. **Immediate** — Revert Nginx upstream to previous Node.js build (keep both builds deployed).
2. **Within 1 hour** — Restore database from pre-deployment backup if migration caused corruption.
3. **Within 4 hours** — Roll back Cloudflare DNS to previous IP if Nginx config caused outage.

---

## Final Architecture Maturity Assessment

| Area                   | Maturity   | Notes                                                        |
| ---------------------- | ---------- | ------------------------------------------------------------ |
| UI/UX                  | ⭐⭐⭐⭐⭐ | Enterprise-grade with TanStack Router, shadcn/ui, Recharts   |
| Design System          | ⭐⭐⭐⭐⭐ | Consistent, reusable components                              |
| RBAC                   | ⭐⭐⭐⭐⭐ | Full permission matrix, role hierarchy, delegation           |
| Workflow Engine        | ⭐⭐⭐⭐⭐ | Custom, database-driven, business rule integration           |
| Approval Engine        | ⭐⭐⭐⭐⭐ | Multi-step, escalation, delegation, audit trail              |
| Configuration Platform | ⭐⭐⭐⭐⭐ | Company profile, holidays, business rules, control numbers   |
| Backend Blueprint      | ⭐⭐⭐⭐⭐ | Complete with ADRs, standards, and strategies                |
| Technology Stack       | ⭐⭐⭐⭐⭐ | Finalized with Prisma, Express, PostgreSQL, Cloudflare       |
| Database Planning      | ⭐⭐⭐⭐⭐ | 3NF schema, indexes, relationships documented                |
| Scalability            | ⭐⭐⭐⭐⭐ | On-premise with room to grow (Redis, Elasticsearch reserved) |
| Maintainability        | ⭐⭐⭐⭐⭐ | Clean architecture, comprehensive documentation              |

---

## Phase 6 Deliverables — Enterprise Architecture Finalization

Before writing backend code, the following documents must be completed:

- [x] **Architecture Decision Records (ADRs)** — 6 ADRs documenting key technology choices
- [x] **API Standards** — Versioning, response format, error codes
- [x] **Logging Strategy** — Application, API, audit, security logs defined
- [x] **Backup & Disaster Recovery Plan** — Daily/weekly/monthly backups, RTO/RPO targets
- [x] **Environment Strategy** — Development, Testing, UAT, Production environments
- [x] **Deployment Guide** — Nginx, Cloudflare, Docker configuration
- [x] **Coding Standards** — TypeScript, error handling, transaction boundaries
- [x] **Branching Strategy** — GitFlow or trunk-based development

Once these documents are in place, the team has a clear contract for implementation. The backend can be built incrementally — module by module — following the blueprint and ADRs.

---

_Document Version: 1.0_  
_Last Updated: July 2026_  
_Status: Approved for Implementation_
