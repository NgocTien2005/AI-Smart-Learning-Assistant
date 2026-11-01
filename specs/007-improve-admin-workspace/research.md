# Research — ADMIN007
2026-11-01. Source inspection, not authenticated live evidence.

## Baseline / prior features
Official resolver identified006; official script allocated007. CLI/integration1.2.3 Codex/PowerShell/sequential; no init/upgrade/constitution edit, no extension hooks. Clean HEAD e4ccbf2913ed5f3fee16b6eb98bb42bd4eb92a53 with existing006 work:198 tracked+13 untracked=211 baseline hashes, saved in .artifacts/admin-workspace-20261101/baseline.json.
Baseline frontend npm test PASS5 service+160 component cases. Historical005 intermittent quiz-history failure not reproduced or fixed.
Prior open acceptance:001 T021/T022/T024/T025;002 T018/T019/T021/T022;003 T021/T022/T024/T025;004 T021/T022/T024/T025;005 T021/T022/T024/T025/T027/T028;006 T021/T022/T024/T025. Original task text stored separately; no task transferred/closed.
Clarify taxonomy: scope/data/lifecycle/interactions/errors/security/completion clear; performance/scale preserves current bounds, external services excluded. No critical ambiguity/no questions; documented existing draft lifetime and supported discovery defaults.

## Source trace / documentation conflicts
App.jsx AdminRoute ADMIN guard→AppLayout→AdminPage→apiRequest→backend/server.js→src/app.js /api/admin→routes/admin.js→authenticate→authorizeRole ADMIN→Prisma User/Course/Enrollment. backend/app.js legacy harness is not production.
Production contract: [contracts/admin.md](contracts/admin.md).
README.md line126 backlog still includes extraction/summaries despite lines57/59 and backend/src/services/documentProcessing.js / routes/courses.js implementing them; OCR absent. frontend/README.md src/data prototype description differs from current API-backed pages. docs/development-workflow.md pre-init snapshot dated2026-10-28 differs from current initialized1.2.3; not an instruction to reinit. These unrelated docs remain unchanged.
Current AdminPage already has per-ID locks/dirty drafts and guarded reads, but repeats full forms for every row; mounted-only mutation guards miss credential replacement and global outcome can overwrite another target's feedback. This is source-derived, not a live visual observation.

## Phase0 decisions (one read-only research agent consolidated)
- R01 Decision: one selected editor + per-ID drafts; rationale: list primary while preserving current lifetime; alternative: discard on close/switch would silently lose existing drafts.
- R02 Decision: keyed context wrapper plus006 generation guard; rationale: stale success/error must not touch replacement session, same token included; alternative: edit shared session/API unnecessarily broad.
- R03 Decision: preserve per-ID independent locks and read sequence at both write boundaries; rationale: old/intermediate GET cannot undo confirmed state; alternative: global lock blocks existing independent-account workflow.
- R04 Decision: per-target outcomes and separate list error; rationale: saved-but-reload-failed stays honest and another draft is untouched; alternative: single global notice races.
- R05 Decision:403 local action block + explicit current identity verification; rationale: role denial is distinct from token expiry; no last-ADMIN rule or new filters.
Agent inspected source/tests only, wrote no files. Existing ADMIN tests need session fixture and explicit selection before editing; keep every original behavioral assertion, all006 tests unchanged.

## Runtime / safety
Current probes:8081 /api/health200,8080/3000 unavailable; Compose backend/db healthy, frontend running on8081. CUA browser access host unavailable; Orca tab inventory initially empty. Missing/invalid synthetic-token requests to /api/admin/users return401 AUTH_REQUIRED/SESSION_INVALID without users. These cover anonymous denial only.
No account IDs or safe name-write operations designated. Live role/status changes user-performed. No real credential retrieval, writes/provision/seed/reset/delete. Integration script uses HTTP target plus Compose db SQL provisioning/cleanup; not run without suitable verified targets and authorized writes. Existing deployed assets are not evidence of007 until current implementation is served.
