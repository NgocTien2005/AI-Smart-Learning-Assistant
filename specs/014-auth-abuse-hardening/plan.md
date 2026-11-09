# Implementation Plan: Auth abuse hardening

## Summary

Add dependency-free bounded middleware, production-router factories for tests,
safe JSON boundary and API headers/logging. Keep Bearer and endpoint contracts.

## Technical Context

Node24+/Express5/Prisma7, existing bcrypt/JWT; no dependency/schema changes.
AuthPage/ResetPasswordPage → SessionContext/apiRequest → production src/app.js
→ auth.js/authenticate → Prisma + Gmail service; legacy app.js excluded.

## Constitution Check

I success/error contracts preserved; II real current-user authVersion and role
checks retained; III existing recovery/UI unchanged; IV production tests + DB;
V no private config/data/volumes touched. Pre/post-design PASS; no exceptions.

## Project Structure

backend/src/middleware/{rateLimit,requestBoundary,securityHeaders,authenticateFactory}.js;
backend/src/routes/auth.js factory; backend/src/app.js assembly;
backend/src/routes/courses.js join limiter; backend/test/{auth,rateLimit,requestBoundary}.test.js;
docs/security.md. Retire backend/app.js only after source reference check and
porting every behavioral test. No frontend/UI edits in this feature.

## Design decisions and phases

1. Inject Prisma/auth/token/email dependencies into real auth router and current-user
   middleware; preserve default production assembly. Port existing legacy tests.
2. Rate buckets use hashed keys and maximum10000entries per limiter, expire after
   fixed window, reject capacity with429 (no eviction bypass). No raw identifiers.
   Login100/IP/15min +10/IP/email/15min; register40/IP/hour;
   forgot20/IP/15min +5/IP/email/15min; reset30/IP/15min;
   change-password20/current-user/15min; join20/current-user/15min.
   All attempts count before work, including malformed input where route middleware
   is reached. Budget expiration enables explicit retry. No automatic password replay.
3. Express trust proxy remains false. Never read X-Forwarded-For as identity; shared
   Nginx budget documented. Deployment-specific trusted subnets/shared store deferred.
4. Reject non-object body on POST/PUT/PATCH unless parsed multipart; JSON strict
   parser size1MiB; structured413/400. Preserve per-route field validation.
5. Disable x-powered-by; API no-store, nosniff, no-referrer. Static headers belong
   to deployment feature; no blind CSP/COOP/HSTS enabling. Log safe event/code only.

## Risks and verification

Shared IP causes stricter shared budgets; process restart/multiple replicas weaken
limits. Tests inject clock/capacity, not disable production protection. Isolated
integration real HTTP+DB must pass under actual defaults. Full backend/quiz tests,
Prisma validate, health and integration; no full frontend rerun for backend-only.

## Complexity Tracking

Factory boundaries reuse existing Express style; no service framework or datastore.
