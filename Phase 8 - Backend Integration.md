HST Enterprise Portal — Phase 8: Real Backend Integration (Module-by-Module Migration)
Current Project Status

The authentication system has been fully migrated from mock data to the real backend.

Completed:

PostgreSQL authentication
JWT login
Refresh token
Prisma integration
RBAC from database
Users & Roles connected to PostgreSQL
Employee records connected
Sidebar generated from database permissions
Demo Role Switcher removed
Mock authentication removed

The application is no longer a frontend prototype.

The next objective is to migrate every remaining module from mock data to real backend services.

Overall Goal

Completely eliminate every remaining mock service.

Every screen, dashboard, approval, notification, request, and report must retrieve and update data from PostgreSQL through the Express API.

No frontend mock data should remain.

IMPORTANT DEVELOPMENT RULES

Before modifying anything:

Study the existing architecture first.

Understand:

React architecture
TanStack Router
TanStack Query
Express API
Prisma repositories
Service layer
Workflow Engine
Notification Engine
Audit Engine
RBAC middleware

Do NOT rewrite working code.

Do NOT duplicate logic.

Reuse existing enterprise components.

Maintain the current design system.

Migration Strategy

Migrate only ONE module at a time.

A module is considered complete only after ALL of the following are finished:

✓ Database CRUD

✓ API Endpoints

✓ Repository

✓ Service

✓ Controller

✓ Validation

✓ Frontend Query Hooks

✓ Frontend Mutations

✓ Forms

✓ Details Drawer

✓ Timeline

✓ Comments

✓ Attachments

✓ Approval Workflow

✓ Notifications

✓ Audit Logs

✓ Dashboard Statistics

✓ Reports

✓ Search

✓ Pagination

✓ Filters

✓ Export

Only after a module is fully complete may the next module begin.

Module Migration Order

Follow this exact sequence.

Module 1

Gate Pass

Complete every feature before continuing.

Includes:

Create
Edit
Cancel
Submit
Approve
Reject
Return
Timeline
Comments
Attachments
Dashboard KPIs
Reports
Search
Export
Notifications
Audit Trail
Module 2

Leave

Complete entire module.

Includes leave balances.

Approval workflow.

Calendar.

Notifications.

Audit.

Module 3

MRF

Complete end-to-end.

Workflow.

Timeline.

Approval.

Comments.

Attachments.

Reports.

Module 4

Purchase Request

Complete all procurement workflow.

Approval routing.

Reports.

Export.

Module 5

Visitors

Real visitor records.

Check In

Check Out

Approval

Security integration

History

Module 6

Vehicles

Reservations

Assignments

Maintenance

Driver assignment

History

Module 7

Assets

Borrow

Return

Transfer

Maintenance

History

Approval

Backend Requirements

Every module must contain:

Repository

↓

Service

↓

Controller

↓

Route

↓

Validation DTO

↓

Workflow Integration

↓

Notification Integration

↓

Audit Integration

↓

Attachment Integration

↓

Comments

↓

Search

↓

Pagination

↓

Filters

↓

Export

No shortcuts.

No temporary code.

Frontend Requirements

Every module must use TanStack Query.

Replace every mock service.

Replace every mock dataset.

Replace every fake statistics card.

Replace every fake timeline.

Replace every fake comments.

Replace every fake attachments.

Replace every fake notifications.

Replace every fake dashboard.

Everything must come from API.

API Standards

Follow existing standards.

GET

POST

PUT

PATCH

DELETE

Consistent response:

{
    "success": true,
    "message": "",
    "data": {},
    "meta": {}
}

Handle:

Loading

Empty

Error

Retry

Unauthorized

Forbidden

Validation Errors

Server Errors

Approval Integration

Every module must automatically use the Universal Workflow Engine.

When a request is submitted:

Generate Control Number

↓

Create Workflow

↓

Create Approval Steps

↓

Notify Next Approver

↓

Record Audit Log

↓

Show Timeline

↓

Allow Approve

↓

Allow Reject

↓

Allow Return

↓

Complete Workflow

Do not duplicate approval logic.

Reuse the existing Workflow Engine.

Audit Logging

Every create/update/delete/approve/reject/return action must generate an Audit Log.

Capture:

User

Employee

Role

Action

Entity

Entity ID

IP Address

Browser

Timestamp

Changes

Notifications

Every module must automatically generate notifications.

Examples:

Request Submitted

Approved

Rejected

Returned

Comment Added

Mention

Reminder

Escalation

Completion

Reuse the existing Notification Engine.

Attachments

Reuse the existing Attachment Service.

Every module must support:

Upload

Preview

Download

Delete

Version History (if already supported)

No duplicated upload implementation.

Comments

Reuse the universal comment system.

Support:

Replies

Mentions

Timestamp

Edited

Deleted

Audit

Reports

Each module must include:

Search

Sorting

Pagination

Advanced Filters

Export Excel

Export PDF

Print

Dashboard Cards

Charts

Completion Criteria for Each Module

A module is only complete if:

No mock data exists.
All CRUD operations work against PostgreSQL.
All API endpoints function correctly.
Workflow executes correctly.
Notifications are generated.
Audit logs are recorded.
Dashboard statistics reflect live data.
Reports use real database queries.
Search, filtering, pagination, and export function correctly.
RBAC permissions are enforced from the database.
The module compiles with zero TypeScript errors.
The module passes manual end-to-end testing.
Development Process

For each module, follow this workflow:

Analyze the current frontend and backend implementation.
Identify all remaining mock dependencies.
Implement missing repository methods.
Implement business logic in the service layer.
Expose REST API endpoints.
Connect frontend using TanStack Query.
Replace all mock data with live API data.
Integrate Workflow, Notification, Audit, Attachment, and Comment services.
Test the full module from request creation through completion.
Remove obsolete mock code and confirm the module is production-ready before moving to the next one.
Final Objective

By the end of this phase:

Every operational module uses PostgreSQL.
The frontend contains no mock data or demo services.
All modules share the same enterprise architecture, approval engine, notification engine, audit engine, and attachment system.
The HST Enterprise Portal is fully data-driven, RBAC-secured, and ready for user acceptance testing (UAT) before deployment.