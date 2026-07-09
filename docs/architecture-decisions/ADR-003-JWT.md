# ADR-003: JWT Authentication with Access + Refresh Token Pattern

## Status

**Accepted** — July 2026

## Context

The ERP requires a stateless authentication mechanism that supports employee-number-based login, RBAC integration, and secure session management for a local on-premise deployment.

## Decision

Use **JWT (JSON Web Tokens)** with a dual-token pattern: short-lived access tokens (15 minutes) and long-lived refresh tokens (7 days).

## Rationale

- **Stateless** — Access tokens are verified without database lookups, reducing latency on every API call.
- **Employee number login** — JWT payload includes employee number, role IDs, department ID, and permissions for quick RBAC decisions.
- **Refresh token rotation** — Each refresh invalidates the previous token, preventing token replay attacks.
- **Secure storage** — Access tokens in memory; refresh tokens in HTTP-only secure cookies (or localStorage with encryption for SPA).
- **RBAC-ready** — Custom claims (`roles`, `dept`, `scope`) allow middleware to enforce permissions without extra queries.

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **Session-based auth (express-session)** | Requires server-side session storage; adds latency; harder to scale horizontally. |
| **OAuth 2.0 / OIDC** | Overkill for an on-premise ERP with a single identity source (local users table). |
| **Magic link / passwordless** | Not appropriate for internal enterprise daily-use application. |
| **API keys** | No user context, no expiry, no revocation mechanism. |

## Token Lifecycle

```
Login → Issue Access Token (15m) + Refresh Token (7d)
         ↓
API calls use Access Token (Authorization: Bearer)
         ↓
Access Token expires → Client uses Refresh Token
         ↓
Server validates Refresh Token → Issues new pair
         ↓
Old Refresh Token is revoked (rotation)
         ↓
Logout → Delete Refresh Token from DB
```

## Consequences

### Positive

- Fast authentication — no database call for access token verification.
- Fine-grained RBAC via JWT custom claims.
- Refresh token rotation provides security without requiring constant logins.

### Negative

- JWT cannot be revoked server-side (short TTL mitigates this).
- Requires secure handling of refresh tokens on the client.
- Token size increases with RBAC claims — must stay under HTTP header size limits.