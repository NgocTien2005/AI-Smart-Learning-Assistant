# Feature Specification: Self-host deployment kit

Created2026-11-17. Branch chore/self-host-deploy-kit, temporary stack on022 f863133; intended PR base refactor/remove-google-auth.

## Problem, goals and non-goals

User needs executable deployment configuration and Vietnamese instructions, plus an honest remaining-work inventory. Current compose publishes HTTP globally and only dev override forwards Gemini keys. Prepare a single-host VPS guide and loopback-only override without touching local/prod data or deploying. Preserve all LMS/auth contracts, users and migrations. No cloud purchase, dependency upgrade, demo seed, domain selection, remote credential workaround or production-ready claim.

## User Scenarios & Testing

### US1 (P1): Operator prepares an HTTPS host

Independent test: resolve configuration with synthetic env, inspect binding/origins, follow guide on staging.
Acceptance: frontend only binds127.0.0.1:18080; db/backend have no published ports; one HTTPS domain used for CORS/reset; host Caddy serves HTTPS; no development origin/seed marker.

### US2 (P1): Operator configures and operates safely

Independent test: optional Gemini flag/key resolution, migration/admin setup steps and recovery guide review.
Acceptance: Gemini chat independent of demo; keys stay server/private; no demo seed/credentials; bootstrap admin setup validated; backup covers DB/uploads, rollback preserves data. Guide states Docker/IP-limiter/DB privilege/Free-provider constraints.

## Requirements

- FR001: Provide opt-in compose.web.yaml merging with base; replace rather than append frontend ports, require domain, keep DB/backend internal and HTTP loopback18080. Default dev stack unchanged.
- FR002: Propagate optional Gemini chat private key/Free confirmation, force demo marker false, preserve SMTP/password/role/access controls. No live provider sends for config tests.
- FR003: Vietnamese deploy guide covers exact revision transfer/private Git, Docker/Caddy installation, DNS/firewall/TLS, secrets, migration/admin, verification, backup/update/rollback; no remote deployment.
- FR004: Review bootstrap path for usable validated operator input; only reproducible blocking defects may receive narrow regression fixes with unchanged password policy/schema/API.
- FR005: Automated synthetic configuration checks must reject missing required values, prove merged ports/env/storage and never print resolved secrets or invoke daemon/up/seed.
- FR006: Inventory historical incomplete/superseded tasks without checkbox laundering or blocked-profile cleanup; evidence distinguishes config validation, earlier integration and unrun live/public checks.

## Security, compatibility and entities

No schema/migrations/dependencies. Existing volumes untouched. New deployment uses explicit fresh project lumina-web on operator host; never reuse local8081. Secrets in chmod600 ignored .env.web, not VITE/logs/PRs. Single process rate limits remain shared behind proxy; do not trust spoofed forwarding or silently disable limiter. Keep sensitive data out of Gemini Free. Existing dormant OAuth history retained, not reimplemented.

## Success Criteria

SC001: Config tests prove exclusive loopback binding, internal DB/backend, exact HTTPS origins and disabled demo.
SC002: Operator has complete commands and public/staging acceptance checklist; unexecuted DNS/TLS/recovery explicitly pending.
SC003: Relevant tests pass, docs links valid, exact local/hosted status reported. Never claim public readiness from config-only validation.

## Clarifications

No secret/host needed for kit preparation. User was asked target; pending response defaults to a documented VPS Ubuntu/Docker/Caddy example only, not spending or deployment authorization. Live verification remains conditional on Docker recovery and user-owned host/domain. No other critical ambiguity.
