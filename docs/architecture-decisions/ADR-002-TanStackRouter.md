# ADR-002: Use TanStack Router for Frontend Routing

## Status

**Accepted** — July 2026

## Context

The frontend requires a routing solution that supports nested layouts for the ERP shell, type-safe route parameters, lazy loading, and RBAC route guards.

## Decision

Use **TanStack Router** (formerly TanStack Router) over React Router or file-based routing frameworks.

## Rationale

- **Type-safe routing** — Route parameters, search params, and state are fully typed — eliminating an entire class of bugs.
- **Nested layouts** — Natural support for the ERP shell pattern (sidebar + header + content area) without manual layout nesting.
- **Route loaders** — Built-in data loading with TanStack Query integration for pending/error/success states.
- **Route guards** — `beforeLoad` hooks enable RBAC checks at the route level, preventing unauthorized access before rendering.
- **File-based routing** — Cleaner project structure; routes are auto-discovered from the directory structure.
- **Lazy loading** — Automatic code splitting per route, critical for an ERP with 30+ module pages.
- **Search params** — Type-safe search param handling for list filtering, pagination, and sorting.

## Alternatives Considered

| Alternative | Reason for Rejection |
|-------------|---------------------|
| **React Router v6/v7** | No type-safe routing, limited nested layout support, no built-in data loading pattern. |
| **Next.js App Router** | Requires full Next.js framework migration; overkill for SPA ERP. |
| **Remix** | Requires full framework migration; server-centric model not ideal for on-premise SPA. |
| **wouter** | Too minimal for enterprise routing needs. |

## Consequences

### Positive

- Full type safety from route definitions to link components.
- Clean nested layout structure matching the ERP application shell.
- Route-level RBAC without additional wrapper components.

### Negative

- Smaller community than React Router — fewer third-party resources.
- Learning curve for the loader/guard pattern.
- Occasional breaking changes in minor versions (mitigated by TypeScript catching issues).