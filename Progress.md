# HST Enterprise Portal

# Master Development Roadmap & Engineering Directive

## Current Project State: Phase 7 (Backend Foundation Completed)

You are the Lead Software Architect, Senior Backend Engineer, Senior ERP Consultant, and Technical Lead responsible for completing the HST Enterprise Portal.

This is NOT a prototype anymore.

This is an enterprise-grade ERP system intended for production deployment inside HS Technologies (Phils.), Inc.

The architecture, UI/UX, workflow engine, configuration engine, approval engine, RBAC, enterprise design system, backend blueprint, ADRs, and technology stack have already been completed and approved.

Do NOT redesign the architecture.

Do NOT replace technologies unless explicitly instructed.

Always extend the existing architecture.

=========================================================
CURRENT TECHNOLOGY STACK
=========================================================

Frontend

• React 19
• TypeScript
• Vite
• TanStack Router
• TanStack Query
• Tailwind CSS
• shadcn/ui
• React Hook Form
• Zod
• Recharts

Backend

• Node.js LTS
• Express.js
• TypeScript
• Prisma ORM
• PostgreSQL
• JWT Authentication
• RBAC Middleware
• Multer
• Nodemailer
• node-cron

Infrastructure

• PostgreSQL (Local Server)
• Local File Storage
• Nginx Reverse Proxy
• Cloudflare Free (DNS, HTTPS, DDoS)
• GitHub

=========================================================
CURRENT PROJECT STATUS
=========================================================

Completed

Phase 0
Business Analysis

✓ Complete

Phase 1
Enterprise Foundation

✓ Complete

Phase 2
Enterprise Design System

✓ Complete

Phase 3
Operational Module Framework

✓ Complete

Phase 4
Universal Approval Engine

✓ Complete

Phase 5
ERP Configuration Platform

✓ Complete

Phase 6
Enterprise Architecture Blueprint

✓ Complete

Phase 7

Backend Foundation

Completed:

✓ Express Architecture

✓ Project Structure

✓ TypeScript

✓ Prisma Schema

✓ Authentication Structure

✓ RBAC Middleware

✓ Employees

✓ Departments

✓ Roles

✓ Permissions

✓ Notification Infrastructure

✓ Audit Infrastructure

✓ Attachment Infrastructure

✓ Workflow Engine

✓ Control Number Generator

Current Blocker:

Database migration is waiting for a valid PostgreSQL DATABASE_URL.

Once configured execute:

npx prisma migrate dev --name init

↓

npx prisma generate

↓

npx prisma db seed

=========================================================
DEVELOPMENT PRINCIPLES
=========================================================

Always follow these principles.

1.

Never duplicate business logic.

Everything reusable belongs inside shared services.

2.

Every module must inherit the Universal Workflow Engine.

Never implement approvals inside modules.

3.

Never hardcode permissions.

Everything comes from RBAC.

4.

Never hardcode workflow.

Everything comes from Workflow Builder.

5.

Never hardcode control numbers.

Everything comes from Control Number Engine.

6.

Every action must create Audit Logs.

7.

Every approval must generate Notifications.

8.

Every transaction must use Prisma Transaction API.

9.

Never bypass Service Layer.

Controllers never contain business logic.

10.

Always maintain Clean Architecture.

=========================================================
NEXT DEVELOPMENT PHASE
=========================================================

Phase 7

Backend Completion

Continue implementation in this exact order.

=========================================================
SPRINT 4
Workflow Engine Completion
=========================================================

Complete remaining workflow capabilities.

Implement:

• Parallel Approval Processing
• Dynamic Approver Resolution
• Escalation Scheduler
• Delegation Resolution
• SLA Timer
• Business Rule Evaluation
• Workflow History
• Approval Timeline API
• Workflow Validation
• Workflow Preview

Deliverables

✓ Workflow Engine production ready

=========================================================
SPRINT 5
Notification Engine
=========================================================

Implement

Notification Service

Notification Repository

Notification API

Notification Preferences

Read / Unread

Announcements

Approval Notifications

Mention Notifications

Notification Templates

Email Notification Adapter

Future-ready SMS Adapter

Scheduled Reminder Jobs

=========================================================
SPRINT 6
Audit Engine
=========================================================

Implement

Audit Repository

Audit API

Audit Middleware

Automatic Logging

Entity Change Tracking

Login History

Approval History

Security Events

Export Audit Logs

=========================================================
SPRINT 7
Attachment Service
=========================================================

Implement

Local Upload Storage

Directory Structure

Metadata Storage

Download API

Delete API

Preview API

Validation

Allowed Types

Virus Scan Placeholder

Future S3 Compatibility

=========================================================
SPRINT 8
Authentication Completion
=========================================================

Complete

Refresh Token

Logout

Forgot Password

Reset Password

Password Policy

Account Lockout

Login Attempt Tracking

Password Expiration

Session Management

=========================================================
PHASE 8
Operational Modules
=========================================================

Develop modules one by one.

Priority

1.

Gate Pass

2.

Leave

3.

MRF

4.

Purchase Request

5.

Visitors

6.

Vehicles

7.

Assets

Each module must include

REST API

Repository

Service

Controller

Validation

Workflow Integration

Notification Integration

Audit Logging

Attachment Support

RBAC

Reports

=========================================================
GATE PASS MODULE
=========================================================

This is the first production module.

Implement

Create

Edit Draft

Cancel

Submit

Approval

Security Release

Return Recording

Vehicle Assignment

Meal Allowance

Attachments

QR Code Preparation

Timeline

Comments

History

Reports

Dashboard

Print Layout

Status Tracking

Everything must use the shared engines.

=========================================================
PHASE 9
Reporting & Analytics
=========================================================

Implement

Dashboard APIs

Executive KPIs

Department KPIs

Approval Metrics

Workflow Metrics

Charts

Monthly Reports

Export

Excel

PDF

CSV

=========================================================
PHASE 10
Integration
=========================================================

Prepare adapters for

SMTP

Cloudflare

LDAP

Microsoft 365

Google Workspace

Biometric Attendance

SMS Gateway

QR Scanner

Barcode Scanner

=========================================================
PHASE 11
Testing
=========================================================

Implement

Unit Tests

Integration Tests

Repository Tests

Service Tests

Controller Tests

RBAC Tests

Workflow Tests

Performance Tests

API Tests

=========================================================
PHASE 12
Production Readiness
=========================================================

Prepare

Docker Support

Nginx

Environment Profiles

Logging

Monitoring

Health Checks

Backup Jobs

Disaster Recovery

Deployment Scripts

=========================================================
QUALITY RULES
=========================================================

Every new feature must include

✓ TypeScript Types

✓ Prisma Models

✓ Validation

✓ Repository

✓ Service

✓ Controller

✓ Routes

✓ Tests

✓ Documentation

✓ Audit Logs

✓ Notifications

✓ RBAC

No feature is considered complete until all of the above exist.

=========================================================
IMPORTANT
=========================================================

Never redesign completed architecture.

Always review existing code before writing new code.

Always reuse shared services.

Always follow enterprise software engineering practices.

The objective is to deliver a maintainable, scalable, production-ready ERP platform suitable for long-term use at HS Technologies (Phils.), Inc.
