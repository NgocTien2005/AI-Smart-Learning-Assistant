# Verification — grounded study evaluation

2026-11-09, feat/ai-quality-improvements, independent audit base2891c11;
intended PR base portfolio/00-audit-speckit. No new provider/API/schema/dependency,
frontend edit, private configuration read or real provider request.

## Workflow

Official script allocated017; resolver/setup-plan/setup-tasks/checklist prerequisite
commands exit0; hooks absent. Specify/clarify all categories clear; no unanswered
provider/privacy decision. Plan reuses existing utilities/validators. Checklist
generated unchecked then separately authorized review3/3, spec quality4/4 before
implement; markers frozen. Read-only analyze/no-persist:5FR+3SC covered by6tasks,
no ambiguous/duplicate/unmapped or CRITICAL/HIGH issue; artifacts/state unchanged.

## Confirmed findings and reproduction

Initial offline fixture run:15/20 pass, exit1, before production code changes.
Five failed cases expose these defects, not a provider failure:

| ID / severity | Files / evidence | Root cause | Solution | Regression risk | Acceptance / required tests |
| --- | --- | --- | --- | --- | --- |
| AI01 Medium | utils/studyAssistant.js; lookup-uppercase-d fails for question định/source Định | Uppercase Đ converted to lowercase only after đ replacement; later ASCII filter removes it | Lowercase before đ folding | Accent/case matching | Same Vietnamese term matches across case; lookup-vietnamese/uppercase-d and existing lookup tests |
| AI02 Medium | same file; RAM retrieves unrelated Program passage | Substring includes instead of token membership | Normalized passage token Set, stable score/order/top3 retained | Less substring recall; no promise of paraphrase support | lookup-substring-refused/missing-topic/no-context and real HTTP/local lookup integration |
| AI03 Medium | services/demoCloudAssistant.js; space/unicode duplicate options and repeated questions accepted | Raw Set sees display-equivalent encodings as different; no question uniqueness | NFC/whitespace canonical uniqueness; retain case distinctions | Over-restricting identifiers or malformed provider behavior | Three duplicate regressions rejected; valid summary/quiz and Name/name distinction pass; existing citation/provider tests retained |

No claim that these synthetic controlled outputs came from Gemini. New evaluation
does not close012T012 or expand original-demo consent.

## Traceability and actual checks

| Source | Tasks | Evidence |
| --- | --- | --- |
| FR-001,US1-AC1/2 |T001/T003 | Red-before/green-after token/Đ cases; original source-only passage ranking retained |
| FR-002,US2-AC2 |T001/T004 | NFC/whitespace duplicates rejected, case-sensitive identifiers accepted, fabricated citations/insufficient responses validated |
| FR-003/004,US2-AC1,SC-001 |T002 |21 original fixed cases, offline runner with case-ID summary/nonzero failures; fetch forbidden by unit wrapper; no real DB client |
| FR-005,US2-AC3 |T004/T005 | Modified instruction-bearing source denied by original proof; existing authorization/stale response/provider-limit/timeout tests unchanged |
| SC-002/003 |T005/T006 | Full backend/quiz, isolated HTTP/DB and honest docs/ai-evaluation.md; hosted evidence follows actual push |

Commands cwd backend: `node scripts/evaluate-study.mjs` initial1 (expected red)
then0 (20/20); `npm test`0 (76tests at20-case stage), quiz filter0 (18 matching/file
results), existing CI safety0 (23tests). Added case-sensitive preservation case
afterward: `node --test test/studyEvaluation.test.js`0,21/21. Production utility/
validator unchanged after full backend/integration check; no unrelated rerun needed.

Root `node scripts/ci/integration.mjs`0: build/healthy0, actual backend/database
proof before provisioning, migration status0, test:integration0, scoped down0.
90HTTP operations/33resources, owned users0. No browser rerun for backend-only.
No test guard/assertion disabled; no provider/mock fallback in production.

## Cleanup and limits

Project lumina-acceptance-ci-1794243514572-03829b04, HTTP loopback59200,
DB lumina_acceptance. Containers/network stopped, owned users0; named volumes
retained: same project `_postgres_data` and `_uploads_data`. No volume deletion,
local8081 access, private dev backend recreation or old-profile operation.

Exact quote validation does not establish semantic entailment. Small offline
cases are not comprehensive AI quality or real Gemini evidence.012T012 remains
open for four real actions/human source review;010T016/008T026 remain in their
features;008T023 historical mailbox evidence preserved. Budget0/no private egress.
