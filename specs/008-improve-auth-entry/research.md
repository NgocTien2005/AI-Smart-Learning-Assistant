# Research: Authentication entry
Date2026-11-03. Clean baseline df570a152e29c4c9cc9efdec01c00a78a492a919.001–007 closed25/22/25/25/28/25/25, no transferred tasks. Baseline frontend5service+184component PASS. Source, two read-only research agents and prior acceptance consulted; source findings are not live browser evidence.

## Decisions
### Production instead of legacy
- Decision: App/router → AuthPage/ResetPasswordPage → SessionContext/API → backend/server.js → backend/src/app.js → src/routes/auth.js/authenticate/email → Prisma User.
- Rationale: backend/app.js legacy harness differs in validation/session. Its auth tests alone cannot establish production behavior.
- Alternatives: copying legacy limits or changing backend to fit frontend rejected.
### Existing session authority with page-local guards
- Decision: retain shared session/API; mounted/location/generation guard before credential install, synchronous pending gate, adopt own installation increment.
- Rationale: shared /me and stale401 already guarded; entry pages lack pre-install guard. React pending alone permits same-tick duplicates.
- Alternatives: shared-session refactor unnecessary; only pre-login generation would reject own success.
### Confirmed entry and uncertainty
- Decision: distinguish accepted entry from /me failure; GET-only retry or explicit logout. No automatic registration/reset/forgot replay.
- Rationale: server may have changed data already; network loss cannot establish non-processing.
- Alternatives: label all as login failure or auto-retry mutation rejected.
### Layout and lifetime
- Decision: compact scoped shell, associated feedback; preserve name/email across modes, clear secrets at boundaries; only existing forgot/reset URL semantics.
- Rationale: current hero dominates and password persists across modes; history not synchronized.
- Alternatives: mobile, new dependencies or registration URL capability out of scope.
### Reset and delivery
- Decision: exact invalid-link400 only disables; general400 recoverable. Own DB token preparation then real UI is labelled fixture. Actual missing-SMTP503/429 testable; delivery NOT RUN.
- Rationale: combined validation400 exists; Gmail-only transport cannot use local sink without backend change. Generic200 includes unknown/inactive/cooldown/delivery failure.
- Alternatives: status-only invalidation, fake delivery or real recipient rejected.

## Documentation conflicts
| Description | Actual production | Resolution |
| --- | --- | --- |
| README auth summary lists Instructor/Student login | backend/src/routes/auth.js login and /me also ADMIN; only registration restricts roles | Correct wording. |
| AuthPage email max254 and all503 SMTP | Production regex no254 limit; login/register infrastructure errors differ | Match endpoint contract. |
| ResetPasswordPage treats all400 invalid | Production has combined validation400 and precise invalid/expired/used400 | Distinguish without backend change. |
Historical PDF/summary/integration-fixture contradictions were addressed in prior acceptance, not new defects.

## Clarify report
Zero questions needed: scope, contracts and lifecycle defaults explicit. Behavior, states, privacy, desktop, identity, integration and evidence coverage clear. No fabricated user answer/constitution change. Built-in spec-quality16/16; separate custom review does not certify implementation.
