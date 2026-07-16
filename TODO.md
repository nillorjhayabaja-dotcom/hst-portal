# HST Enterprise Portal - Production Migration Checklist

## Phase 1 - Infrastructure Audit ✅ (Already Complete)
- [x] AUDIT_REPORT.md generated
- [x] Hardcoded localhost URLs identified
- [x] Configuration gaps documented

## Phase 2 - Cloudflare Workers Frontend
- [ ] Update wrangler.toml with proper configuration (main entry, routes, env vars)
- [ ] Create .env.production with production API URL
- [ ] Configure SPA routing for Workers
- [ ] Build frontend successfully
- [ ] Deploy to Cloudflare Workers

## Phase 3 - Cloudflare Tunnel
- [ ] Update setup-tunnel.ps1
- [ ] Create cloudflared config.yml
- [ ] Configure ingress rules (API only, no DB/storage)

## Phase 4 - Backend Production Hardening
- [ ] Add compression middleware
- [ ] Add trust proxy
- [ ] Add secure cookie configuration
- [ ] Add health check endpoint
- [ ] Add graceful shutdown improvements
- [ ] Restrict CORS to production domain
- [ ] Create PM2 ecosystem.config.cjs
- [ ] Create Windows service setup script
- [ ] Create .env.production for backend

## Phase 5 - PostgreSQL (Local - Verify)
- [ ] Verify DATABASE_URL points to localhost:5432
- [ ] Document PostgreSQL configuration

## Phase 6 - Storage (Local - Configure)
- [ ] Create storage directory structure
- [ ] Verify Express serves files correctly
- [ ] Document storage configuration

## Phase 7 - API Integration
- [ ] Verify all frontend services use VITE_API_BASE_URL env var
- [ ] AuthContext uses environment.ts (already done)
- [ ] No hardcoded localhost URLs remain
- [ ] No mock services remain

## Phase 8 - Authentication
- [ ] Verify login/logout flow
- [ ] Verify refresh token flow
- [ ] Verify RBAC permissions
- [ ] Verify protected routes
- [ ] Verify session persistence

## Phase 9 - Module Verification
- [ ] Dashboard
- [ ] Employees
- [ ] Departments
- [ ] Gate Pass
- [ ] Leave
- [ ] MRF
- [ ] Visitors
- [ ] Vehicles
- [ ] Assets
- [ ] Purchase Request
- [ ] Reports
- [ ] Audit Logs
- [ ] Notifications
- [ ] Workflow Engine
- [ ] Approval Engine
- [ ] QR Generation
- [ ] PDF Generation
- [ ] Printing

## Phase 10 - Security Hardening
- [ ] Helmet (already configured)
- [ ] Rate Limiting (already configured)
- [ ] CORS restricted to production domain
- [ ] JWT validation
- [ ] Audit Logging
- [ ] Role Permissions
- [ ] Cloudflare SSL
- [ ] Input validation with Zod

## Phase 11 - Backup & Recovery
- [ ] Create PostgreSQL backup script
- [ ] Create storage backup script
- [ ] Create restore documentation

## Phase 12 - Monitoring
- [ ] Health check endpoint
- [ ] Application logging
- [ ] Error logging
- [ ] Audit logging
- [ ] Cloudflare Tunnel status monitoring

## Phase 13 - Documentation
- [ ] Infrastructure Deployment Guide
- [ ] Cloudflare Tunnel Setup Guide
- [ ] Windows Server Deployment Guide
- [ ] Ubuntu Deployment Guide
- [ ] PM2 Setup Guide
- [ ] Nginx/IIS Reverse Proxy Guide
- [ ] Backup & Recovery Guide
- [ ] Operations Manual