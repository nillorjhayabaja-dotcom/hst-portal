# ADR-001: Use Prisma ORM for Database Access

## Status

**Accepted** — July 2026

## Context

The HST Enterprise Portal requires a database access layer that supports PostgreSQL, TypeScript integration, migration management, and enterprise-grade security. Multiple ORMs and query builders were evaluated.

## Decision

Use **Prisma ORM** as the primary database access tool.

## Rationale

- **Type-safe client** — Auto-generated TypeScript types ensure compile-time safety between database schema and application code.
- **Migration management** — Declarative schema with auto-generated migrations reduces human error.
- **Prevents SQL injection** — Parameterized queries by default; no raw string concatenation.
- **Easier maintenance** — Single source of truth (`schema.prisma`) for the entire data model.
- **Excellent PostgreSQL support** — Arrays, JSONB, enums, UUIDs, and composite keys are all first-class citizens.
- **Developer experience** — Prisma Studio provides a visual database browser for debugging.

## Alternatives Considered

| Alternative               | Reason for Rejection                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| **Raw SQL (`pg` driver)** | No type safety, manual migration management, higher risk of SQL injection, slower development. |
| **TypeORM**               | Heavier, more complex API, history of breaking changes, less TypeScript-native feel.           |
| **Sequelize**             | Limited TypeScript support, verbose model definitions, less performant query generation.       |
| **Drizzle ORM**           | Newer and less mature ecosystem, smaller community, fewer enterprise adoptions.                |
| **Knex.js**               | Query builder only — no type-safe client, no migration generation, more boilerplate.           |

## Consequences

### Positive

- Faster schema iterations with auto-generated migrations.
- Reduced boilerplate for CRUD operations.
- Strong type safety eliminates an entire class of runtime errors.

### Negative

- Prisma generates its own client — adds ~100MB to `node_modules`.
- Complex queries may still require raw SQL via `$queryRaw`.
- Migration history must be committed to version control.
