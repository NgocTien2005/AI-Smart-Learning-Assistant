# Plan: Self-host deployment kit

## Technical context

Existing Docker/Node24/React/Express/Prisma/Postgres17 unchanged. Production entry server.js -> src/app.js; same-origin Nginx /api -> production auth/course routes -> Prisma. New host Caddy terminates TLS -> loopback18080 Nginx. No Express trust-proxy change; existing backend limiter sees proxy IP and shared budgets, explicitly a staging/public scale gate.

## Constitution check

I consistent HTTPS origin/reset/API; no API changes. II preserve all auth/ownership. III no UI redesign. IV synthetic config tests, narrow bootstrap regression, separate unrun runtime/TLS evidence. V no secret capture, real sends, data deletion, schema/dependency edits. PASS pre/post design. Hook file absent; no hooks.

## Research/architecture

Compose !override requires2.24.4+; Docker28+ for modern loopback publishing behavior. Use fixed127.0.0.1:18080 so additive port merge cannot retain public8080. Host Caddy official service, real DNS80/443 required; fixed sample domain replaced by operator, no automation/contact. Disable request-bearing logs in sample and document diagnostic cost. Optional chat environment independent of demo marker. Operator uses explicit -p lumina-web/--env-file .env.web/-f files on fresh host.

## Phases/files

1. Spec/clarify/official research/checklist/tasks/read-only analysis.
2. compose.web.yaml, deploy/web.env.example and deploy/Caddyfile.example; synthetic parser/merge tests scripts/ci/test/web-deploy.test.mjs. No daemon/start calls.
3. Trace/reproduce admin bootstrap validator; if confirmed narrow fix in backend/scripts/create-admin.mjs, extract pure validation utility/tests only if it improves direct production coverage, preserve12-72 bootstrap password bound.
4. docs/deploy-vps.md in Vietnamese, remaining-work inventory and current readiness/operations/README links. No seed or arbitrary deletion.
5. Relevant static/Node gates; full backend/quiz if bootstrap changes. New override build/health/staging/TLS remain pending until Docker/domain/operator resources available. Record no false hosted/push claims; local coherent commits. Analyze read-only, converge append-only without duplicate blockers.

## Git/risks

Temporary stack chore/self-host-deploy-kit depends022 f863133, intended PR base refactor/remove-google-auth. Previous remote auth canceled; no retry/bypass. Risks: port append exposure, public demo credentials, secret stdout, stale release source on main, provider quota, binary backups corrupted by shell. Tests/guide explicitly cover these. Existing013-022 evidence and008 policy cleanup remain separate.
