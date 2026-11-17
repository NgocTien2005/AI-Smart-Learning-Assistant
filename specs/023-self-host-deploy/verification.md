# Verification: Self-host deployment kit

2026-11-17, baseline f863133 clean; branch chore/self-host-deploy-kit temporarily stacked on022, intended PR base refactor/remove-google-auth. Resolver/official allocator selected023. Constitution/workflow/actual production path reviewed, managed specify/clarify/plan/checklist/tasks/analyze/implement applied; extensions file absent, no hooks.5/5 checklist requirement-quality items reviewed before implement and markers kept read-only. Read-only analysis maps6FR/3SC/2US to6tasks without constitution conflicts.

## Verified

- FR001/002/005 -> T002 ->4 synthetic Compose tests pass: merged port exclusively127.0.0.1:18080, DB/backend internal, exact HTTPS origins, required domain/DB/JWT missing rejected, optional Gemini server-only, demo false, default compose behavior unchanged. Docker compose CLI5.1.1, no daemon/start/DB/provider calls. Wired new tests into existing backend CI runner.
- FR004 -> T003 -> production admin script rejected ordinary synthetic admin@example.invalid before any query (exit1, validation message). Root cause double-escaped regex. Extracted production-used pure validator with correct whitespace/email normalization and unchanged12-72 untrimmed password bound;2 targeted cases cover ordinary/plus-address, malformed/space emails, name/password boundaries. Full backend87pass, quiz command22runner results pass. No admin created or existing data changed.
- FR003/006 -> T004 -> Vietnamese guide, concrete override/env/Caddy samples, source archive path, data/secrets/migration/bootstrap/update/rollback, release inventory and readiness links. Four config cases plus25 CI/operations cases,29total pass after CI wiring. No npm dependency or schema/migration changes in023. No UI code change, frontend/browser suite not repeated for documentation/config alone.
- Official Docker/Caddy references and plan research reviewed; no paid resource/domain/provider selected or contacted. User confirmed VPS Ubuntu guide.

## Commands

root: node --test scripts/ci/test/web-deploy.test.mjs exit0/4; node --test scripts/ci/test/ci.test.mjs scripts/ci/test/operations.test.mjs scripts/ci/test/web-deploy.test.mjs exit0/29. backend/: npm test exit0/87; npm test -- --test-name-pattern=quiz exit0/22; node --test test/adminBootstrap.test.js exit0/2. Test-first missing validator module failed before implementation, not hidden. Source links/diff checked separately. See evidence/checks.json.

Production dependency audit (not an exploit demonstration): backend npm audit --omit=dev --json exit1,6 package advisories(3High/3Moderate), frontend exit0/0; sanitized names/severity in evidence. Remediation is separate scope, not npm audit fix --force hidden in config work. PDF viewer scripting advisory conditionality is documented; text extraction is not evidence of an exploit. Public release is blocked on remediation/review plus runtime gates.

## Unverified and blocked

T005 remains open: new web stack build/health, Caddy parser/real DNS/TLS/renewal, public firewall, migration/admin on actual target, all-role/protected-upload/mail/chat/restore staging. Docker Linux engine is unavailable; prior Desktop restart timed out and OS denied service start. User asked to restore engine; no secret requested or bypass attempted. This work made no further Docker restart/cleanup attempts and did not touch local8081/volumes/blocked profiles. Earlier021 real model and022 HTTP/browser evidence remains historical, never relabeled as this web stack.

No SMTP/Google/Gemini request in023. No seed/reset/drop or new data. No hosted CI for current head, no push/new PR/merge/deploy; prior remote credential prompt canceled, no alternate authentication. Operator can archive exact local commit for staging as guide describes.008T026/010T016/012T012/021T006/T008 remain in original features, no duplicate blocker tasks.

## Analysis/convergence

Final artifact review read-only: all6FR have tasks/evidence or explicit T005 pending acceptance; no security guard/API compatibility dilution. Config supports only hostname presence, operator must validate hostname/DNS separately (guide explicit). Converge compares code/artifacts without changing spec/plan/code; T005 already covers unrun runtime gate, no duplicate/empty convergence section. T006 records local handoff with current hosted/remote limitations; kit preparation does not mean023/public deployment complete.
