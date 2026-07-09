# ADR-005: Custom Workflow Engine with Multi-Step Approval Chains

## Status

**Accepted** — July 2026

## Context

The ERP requires a flexible approval workflow system that supports sequential and parallel approval steps, role-based routing, escalation rules, delegation, and business-rule-driven dynamic routing across all modules (Gate Pass, Leave, MRF, Purchase Request, etc.).

## Decision

Build a **custom workflow engine** with a dedicated database schema (`workflows`, `workflow_steps`, `approval_requests`, `approval_steps`, `approval_actions`, `delegations`, `business_rules`) rather than using a third-party BPMN engine.

## Rationale

- **Domain-specific** — ERP approval flows are simpler than general BPMN workflows. A custom engine avoids BPMN complexity.
- **Database-driven** — Workflow definitions stored in PostgreSQL tables, not XML/BPMN files. Non-technical admins can configure workflows via the frontend.
- **Role-based routing** — Steps are assigned to roles, not individuals. The engine resolves role → users at runtime, supporting dynamic approval assignment.
- **Business rule integration** — Conditions on steps (e.g., "if amount > 50,000 → route to VP") are evaluated at runtime using the `business_rules` table.
- **Escalation & delegation** — Built-in support for time-based escalation and user delegation without external dependencies.
- **Audit trail** — Every action (approve, reject, return, delegate, escalate) is recorded in `approval_actions` and `audit_logs`.

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **Camunda BPMN** | Heavy Java-based engine; overkill for ERP approval flows; requires separate server. |
| **Temporal.io** | Excellent for microservice orchestration but too complex for simple approval chains. |
| **BullMQ job chains** | No built-in support for role-based routing, parallel steps, or business rule evaluation. |
| **State machines (XState)** | Good for frontend state but doesn't handle persistence, role resolution, or escalation. |

## Consequences

### Positive

- Fully customizable to HST's specific approval patterns.
- Non-technical administrators can configure workflows via the UI.
- Tight integration with RBAC, notifications, and audit logging.
- No external service dependencies — runs within the same Node.js process.

### Negative

- Development effort to build and test the engine.
- Must handle edge cases: circular workflows, concurrent approvals, race conditions.
- Requires careful transaction management to ensure consistency across workflow state changes.