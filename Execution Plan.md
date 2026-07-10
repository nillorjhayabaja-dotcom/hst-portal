# HST Enterprise Portal

# AI Implementation Directive

## Enterprise Development Execution Plan

You are the Lead Software Architect, Senior Backend Engineer, Senior Full Stack Engineer, Enterprise ERP Consultant, QA Engineer, and Technical Reviewer for the HST Enterprise Portal.

This project is no longer in the planning stage.

The architecture has been approved.

The frontend architecture has been completed.

The backend blueprint has been completed.

The technology stack has been finalized.

Your responsibility is now to IMPLEMENT the ERP according to the approved architecture.

DO NOT redesign.

DO NOT rewrite completed systems.

DO NOT replace technologies.

Always review the existing implementation before writing code.

The objective is to finish the ERP one milestone at a time.

=========================================================
CURRENT PROJECT STATUS
=========================================================

Completed

✓ Business Analysis

✓ UI/UX

✓ Enterprise Design System

✓ RBAC

✓ Universal Workflow Engine

✓ Approval Engine

✓ Configuration Platform

✓ Backend Blueprint

✓ Architecture Decision Records

✓ Backend Infrastructure

Partial

⚠ Application Services

⚠ Repositories

⚠ Controllers

⚠ Database Migration

⚠ Seed Data

⚠ API Integration

Not Started

❌ Testing

❌ Production Deployment

=========================================================
GLOBAL DEVELOPMENT RULES
=========================================================

Before writing ANY code

Always

1.

Review the current implementation.

2.

Review related services.

3.

Review repositories.

4.

Review DTOs.

5.

Review middleware.

6.

Review workflow integration.

7.

Review notification integration.

8.

Review audit integration.

Never overwrite existing architecture.

Never duplicate logic.

Never skip validation.

Never bypass the Service Layer.

Never access Prisma directly from Controllers.

Never create new PrismaClient instances inside Services.

Repositories own database access.

Services own business logic.

Controllers only coordinate requests and responses.

=========================================================
IMPLEMENTATION STRATEGY
=========================================================

Development must follow Vertical Slice Architecture.

Do NOT implement all repositories first.

Do NOT implement all services first.

Instead

Complete one milestone completely.

Review it.

Test it.

Then proceed.

=========================================================
PHASE 7A
Database Initialization
=========================================================

Goal

Make the backend executable.

Tasks

Configure DATABASE_URL

Run

npx prisma migrate dev --name init

Run

npx prisma generate

Run

npx prisma db seed

Verify

✓ Tables created

✓ Relations valid

✓ Constraints valid

✓ Seed successful

STOP.

Review results.

Do not continue until successful.

=========================================================
PHASE 7B
Core Backend Completion
=========================================================

Implement only these domains.

Users

Employees

Departments

Positions

Roles

Permissions

For EACH domain complete

Repository

↓

Service

↓

Controller

↓

Routes

↓

Validation

↓

Tests

↓

Swagger Documentation

↓

Audit Logging

↓

RBAC

↓

Review

No domain is complete until every layer exists.

=========================================================
PHASE 7C
Workflow Engine Completion
=========================================================

Complete remaining workflow capabilities.

Parallel Approval

Delegation Resolution

Escalation Scheduler

Business Rule Evaluation

Workflow Preview

Approval Timeline

Workflow History

Workflow Validation

SLA Monitoring

Unit Tests

Integration Tests

=========================================================
PHASE 7D
Notification Engine Completion
=========================================================

Complete

Notification Repository

Notification Service

Notification Controller

Notification Routes

Read

Unread

Announcements

Mentions

Approval Notifications

Email Adapter

Notification Templates

Reminder Scheduler

Tests

=========================================================
PHASE 7E
Audit Engine Completion
=========================================================

Complete

Audit Repository

Audit Service

Audit Controller

Audit Routes

Export

Filtering

Entity History

Login History

Approval History

Security Events

Tests

=========================================================
PHASE 7F
Attachment Engine Completion
=========================================================

Complete

Upload

Download

Delete

Preview

Metadata

Validation

Directory Strategy

Future Cloud Adapter

Tests

=========================================================
PHASE 8
Operational Modules
=========================================================

IMPORTANT

Complete ONE module completely before moving to the next.

Module Order

1

Gate Pass

2

Leave

3

MRF

4

Purchase Request

5

Visitors

6

Vehicles

7

Assets

=========================================================
MODULE IMPLEMENTATION CHECKLIST
=========================================================

Every module must contain

✓ Prisma Model

✓ Repository

✓ Service

✓ Controller

✓ Routes

✓ DTOs

✓ Validation

✓ Workflow Integration

✓ Notification Integration

✓ Audit Integration

✓ Attachment Integration

✓ Control Number

✓ Reports

✓ Dashboard API

✓ Search

✓ Pagination

✓ Filtering

✓ Sorting

✓ Unit Tests

✓ Integration Tests

✓ API Documentation

✓ Frontend API Integration

Only after ALL are complete

Proceed to the next module.

=========================================================
GATE PASS IMPLEMENTATION
=========================================================

The first production module.

Complete

Draft

Submit

Approve

Reject

Return

Cancel

Security Release

Vehicle Assignment

Meal Allowance

Timeline

Comments

Attachments

History

Dashboard

Reports

Print Layout

QR Preparation

Everything must use

Workflow Engine

Notification Engine

Audit Engine

Control Number Engine

Business Rules Engine

RBAC

=========================================================
PHASE 9
Reporting
=========================================================

After ALL modules work

Implement

Executive Dashboard

Department Dashboard

Approval Metrics

Workflow Metrics

Monthly Reports

Excel Export

PDF Export

CSV Export

=========================================================
PHASE 10
Frontend Integration
=========================================================

Replace ALL mock services.

Connect frontend to REST APIs.

Remove

Mock Data

Mock Approval Engine

Mock Notification Engine

Mock Search

Mock Dashboard

All frontend state must use

TanStack Query

REST API

=========================================================
PHASE 11
Testing
=========================================================

Required

Unit Tests

Integration Tests

API Tests

Repository Tests

Workflow Tests

RBAC Tests

Security Tests

Performance Tests

Regression Tests

Coverage Goal

Minimum

80%

=========================================================
PHASE 12
Production Readiness
=========================================================

Prepare

Docker

Nginx

Production Environment

Logging

Monitoring

Health Checks

Backup

Restore

Deployment Scripts

Disaster Recovery

=========================================================
QUALITY GATE
=========================================================

Before marking ANY phase complete

Verify

✓ Build passes

✓ TypeScript has zero errors

✓ ESLint passes

✓ Prisma validates

✓ Tests pass

✓ API documented

✓ No duplicate code

✓ Audit logging works

✓ Notifications work

✓ Workflow works

✓ RBAC works

✓ Security reviewed

If any item fails

DO NOT continue.

Fix the issue first.

=========================================================
REVIEW PROCESS
=========================================================

After every completed phase

Perform

Architecture Review

Code Review

Security Review

Performance Review

Database Review

UX Impact Review

Regression Review

Only after all reviews pass

Proceed to the next phase.

=========================================================
FINAL OBJECTIVE
=========================================================

Deliver a production-ready Enterprise ERP system for HS Technologies (Phils.), Inc.

The ERP must be

✓ Maintainable

✓ Scalable

✓ Secure

✓ Modular

✓ Testable

✓ Fully documented

✓ Enterprise-grade

Never sacrifice architecture quality for implementation speed.

Quality, consistency, and long-term maintainability are the highest priorities.
