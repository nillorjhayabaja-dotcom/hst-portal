# ADR-006: Database-Driven Notification Engine with Multi-Channel Support

## Status

**Accepted** — July 2026

## Context

The ERP requires a notification system that alerts users about approval requests, approvals, rejections, escalations, and reminders. Notifications must support in-app display, email delivery, and future SMS integration — all configurable per module and event type without code changes.

## Decision

Build a **database-driven notification engine** where notification rules are stored in PostgreSQL (`notification_rules` table) and processed by a service layer that dispatches to channel-specific adapters.

## Rationale

- **Rule-based** — Notification rules define WHO is notified (roles or specific users), WHEN (which event), and HOW (which channels). Admins configure rules via the frontend.
- **Multi-channel** — In-app (notifications table polled by frontend), email (Nodemailer via queue), and SMS (future). Each channel is an interchangeable adapter.
- **Template-driven** — Email/in-app messages use templates stored in the `notification_rules` table with `{{variable}}` substitution (control number, employee name, etc.).
- **Non-blocking** — Notifications are dispatched asynchronously after the database transaction commits, ensuring approval actions are not delayed by notification delivery.
- **Audit trail** — All sent notifications are recorded with delivery status, timestamps, and channel.

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **Push notifications (WebSocket/SSE)** | Requires persistent connection; overkill for an ERP where polling every 30s is acceptable. |
| **Third-party service (SendGrid, Twilio)** | Adds recurring cost; on-premise ERP should minimize external dependencies. |
| **Email-only** | No in-app notification support; users would miss real-time updates. |
| **Firebase Cloud Messaging** | External dependency; not appropriate for internal on-premise network. |

## Architecture

```
Trigger Event (e.g., gate pass submitted)
         ↓
Load matching notification_rules (module_id + event)
         ↓
Resolve recipients (role_ids → users, plus direct user_ids)
         ↓
Render templates (replace {{variables}} with actual values)
         ↓
For each active channel:
  ├── in_app → INSERT INTO notifications
  ├── email  → Enqueue to BullMQ email queue → Nodemailer
  └── sms    → (future) Enqueue to SMS queue
         ↓
Frontend polls GET /notifications/unread-count every 30s
```

## Consequences

### Positive

- Fully configurable without code changes — admins can add/remove notification rules via UI.
- Multiple channels supported with consistent architecture.
- Templates are stored in the database — no hardcoded strings in application code.

### Negative

- Requires BullMQ/Redis for email queue processing — adds infrastructure dependency.
- In-app notifications are polled, not pushed — up to 30s delay (acceptable for ERP use case).
- Template rendering engine must be built and maintained.