# ADR-004: Use Cloudflare Free Plan for DNS, HTTPS, and DDoS Protection

## Status

**Accepted** — July 2026

## Context

The ERP is hosted on-premise at HST and requires public-facing HTTPS, DNS management, and DDoS protection without incurring recurring cloud infrastructure costs.

## Decision

Use **Cloudflare Free Plan** for DNS management, SSL/TLS termination, and DDoS mitigation.

## Rationale

- **Free tier** — DNS management, SSL certificates, and DDoS protection at no cost.
- **Origin Certificate** — Cloudflare-issued origin certificate enables end-to-end HTTPS from Cloudflare to the on-premise server.
- **DDoS protection** — Absorbs layer 3/4/7 attacks before they reach the local server.
- **CDN for static assets** — Caches frontend build artifacts (JS, CSS, images) at Cloudflare edge nodes for faster loading.
- **DNS management** — Simple UI for managing A, CNAME, TXT records; supports DNSSEC.
- **No port forwarding exposure** — Only Cloudflare IPs are allowed to reach the Nginx reverse proxy, reducing attack surface.

## Alternatives Considered

| Alternative               | Reason for Rejection                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| **AWS Route 53**          | Paid service; adds cloud dependency to an on-premise architecture.    |
| **Let's Encrypt**         | Requires certbot renewal automation; no DDoS protection.              |
| **Self-managed DNS**      | No DDoS protection, manual SSL management, higher maintenance burden. |
| **Namecheap/GoDaddy DNS** | No DDoS protection, no CDN, paid SSL certificates.                    |

## Consequences

### Positive

- Free SSL/TLS with automatic renewal.
- Enterprise-grade DDoS protection without infrastructure changes.
- Static asset caching improves frontend load times.

### Negative

- Cloudflare terminates SSL — traffic between Cloudflare and Nginx must use Origin Certificate (not self-signed).
- Cloudflare can inspect unencrypted traffic (TLS termination point).
- Dependent on Cloudflare's free tier policies — if they change, migration may be needed.
- Must configure Nginx to only accept traffic from Cloudflare IP ranges.
