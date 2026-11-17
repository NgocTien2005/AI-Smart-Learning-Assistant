# Verification: Targeted runtime advisory patches

2026-11-17. Baseline0239b238d5 clean, security/runtime-advisories temporary stack on chore/self-host-deploy-kit; intended PR base that branch. Official allocator/resolver selected024. Constitution/managed workflow and primary-source PDF major compatibility review performed. Hooks file absent.4/4 requirements-quality checklist items reviewed before implement; frozen during implementation. No main/merge/deploy/force-push or remote credential workaround.

## Before, remediation and compatibility

Production npm audit initially reported6 package entries (3High/3Moderate), frontend0; exact sanitized advisories retained in023/checks.json and024/evidence/checks.json. This is a version advisory, not reproduced compromise. Pin minimum direct fixes multer2.5.0,nodemailer10.1.4,pdfjs-dist6.2.108. Named parent-compatible transitive refresh yields body-parser2.4.0,fast-uri3.1.9,qs6.17.1. Other direct packages unchanged. PDF6 requires optional @napi-rs/canvas1.1.1/platform binaries; these lock changes are its dependency requirement, not a separate app capability. Express5.2.1/Prisma7.10 remain. No schema/migration/data/API shape/password changes.

PDF6 tagged Node example uses legacy/build/pdf.mjs/getDocument.promise/getPage/getTextContent/items.str, same extraction pattern. It no longer consumes isEvalSupported: removed obsolete option/commented accurately, did not invent a viewer enableScripting guard. Viewer-script advisory applicability is conditional and not reproduced in current text-only backend; patch still appropriate. Existing Unicode/page citation/no-text/corrupt/limits/timeouts/source-summary-quiz fixtures pass with actual new parser. Node24 Alpine image installs its own native dependency platform, not Windows node_modules.

A new production compressed-input regression found malformed-gzip500. Global handler classified SyntaxError but not known zlib decoding errors. Added only status400 Z_DATA_ERROR/Z_BUF_ERROR generic400 mapping; no raw decoder message/body, broad arbitrary error passthrough or guard disable. Added actual isolated HTTP malformed-compression case. Test failed500 first, then passed400; full suites rerun after this correction.

## Results and traceability

| Requirement | Task | Evidence |
| --- | --- | --- |
| FR001 targeted patches | T002 | package/lock reviewed, npm ci exit0, production npm audit exit0/0 reported advisories |
| FR002 core parser/privacy | T003 | actual PDF/text fixtures and source/quiz tests; obsolete option review, all bounds/ownership unchanged |
| FR003 regressions | T003 | backend87/87, quiz runner22, CI/config29 passed; malformed compressed production body400, no DB access required |
| FR004 rebuilt acceptance | T004 | final fresh Node24 Docker103 HTTP/database ops/33resources, actual DB target proof, auth/role/owner/assignment/quiz/concurrency/upload/PDF/reset, own users0; operations restore/digest/privacy/header drills pass |
| FR004 dataset compatibility | T004 | separate fresh seed stack247 HTTP ops,18users/8courses/48lessons/26docs/24assignments; dry-run no writes/collision deny/rerun no duplicates/sentinel preserved/modified source denied all pass; own users0 |
| FR005 handoff | T005 | current release/deploy guide, read-only analyze/converge, local coherent commits and explicit hosted/public gates |

[Safe command/audit results](evidence/checks.json), [final integration](evidence/integration.json), [allowlisted HTTP](evidence/http.json), [dataset](evidence/seed-integration.json), [runtime](evidence/runtime.json). First successful102-op run before gzip correction retained separately as integration-initial/http-initial, not substituted for final source. Frontend JS/lock unchanged, previous232frontend/lint/build evidence remains applicable; not repeated for backend-only patches.

## Development runtime

Default target guard verified local project/network/mount/actual DB identity before touching source. Copied only package/lock/parser/bootstrap files, ran npm ci inside same backend, restarted without recreation to preserve private env; after gzip fix synchronized app.js and restarted same container. Initial postflight guard ran while Docker health still starting; read-only follow-up waited healthy, no repeated install. Final hash proof matches6 files, patched versions present, both5173/8080 health200/OAuth404; key/Free/chat/SMTP readiness true. No env values read/printed, no default dataset mutation. Clean rebuilt images in isolated projects prove reproducibility beyond this runtime sync.

## Data and retained resources

All automated integration uses separate projects and secrets generated at runtime; no local8081 or existing data/volume/profile cleanup.

- initial lumina-acceptance-ci-1794928769597-4dc82961: postgres_data/uploads_data retained; synthetic operations restore DB lumina_restore_7775f5b03b1dd936,1row/1upload retained.
- final lumina-acceptance-ci-1794929550181-e78401c6: postgres_data/uploads_data retained; restore DB lumina_restore_b8a798dd62369434,1row/1upload retained.
- dataset lumina-acceptance-ci-demo-1794929653105-3470a1: postgres_data/uploads_data retained,26synthetic documents retained,0users.
- Separate023 web test volumes/3owned-account cleanup recorded in023/evidence/web-runtime.json. Own containers/network down; no named volume removal or archive publication. Historical008T026 blocked profiles untouched.

No real email or model requests in dependency/config/integration tests. Separate021 native-control acceptance made3 synthetic-source UI submissions/cancellations and is recorded only there, not fabricated as new successful answers or upstream cancellation.

Password recovery route tests use an injected sender; no claim that new SMTP delivery was tested after Nodemailer patch. Production SMTP/mailbox acceptance remains operator-owned as the deploy guide states; historical008 acceptance is preserved.

## Remaining release gates and analysis

Audit0 is a timestamped tool result, not security certification; image/OS advisories, DB least privilege, shared proxy-IP limits, load, monitoring, real domain/TLS/renewal and production backup/restore remain operator staging gates (023T005). Runtime Node24/PDF integration gate for024 is now satisfied. Hosted CI on this head has not run; prior Git authentication canceled, no alternate authentication/push/new PR. No deployed URL or actual public traffic acceptance.

Read-only final analysis maps5FR/3SC/5tasks with no uncovered patch requirement or constitution violation. Converge is append-only: no new gap in024, so tasks unchanged, no empty phase/duplicate historical blocker. Local patches verified and accounted for by feature commits; whole app/public deployment is not declared complete while external gates remain.
