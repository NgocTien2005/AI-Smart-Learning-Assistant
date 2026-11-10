# Plan: Portfolio handoff

Spec: [spec.md](spec.md). Date2026-11-10. Production source and prior artifacts are the authority. Constitution reviewed: preserve data/contracts, no secret/provider egress, actual verification, SpecKit boundaries; gates pass before/after design. No extensions.yml/hooks.

## Technical context and dependency design
React19/Vite8, Express5, Prisma7/PostgreSQL17, Node24 and Nginx1.27. Documentation only; no data model/API contract change. Integrate separately verified source commits from014-019 onto portfolio/integration-review based on verified origin/main d407a1c. One expected courses.js import conflict must preserve security createJoinLimit alongside extracted child routers; all gates run on combined tree. Branch is a review/demo reference, not an omnibus PR or main merge. docs/portfolio-readiness then branches from verified integration base; intended PR base is integration-review. All original feature PRs remain independently reviewable.

## Implementation
README concise entry/navigation while retaining detailed setup/API references. docs/portfolio-overview.md product/problem/scope; docs/architecture.md source-derived Mermaid architecture/ERD/auth flow, roles/module boundaries; docs/interview-guide.md tradeoffs/questions; docs/demo-script.md real synthetic workflow; docs/portfolio-improvement-report.md before/after and exact evidence/branch/resource matrix. docs/integration-review.md records selected dependencies, conflict and combined verification. No screenshots/benchmarks invented.

## Verification
Combined baseline: full frontend npm ci/test/lint/build; backend npm ci/test/quiz/25CIguards; Prisma validate after npm ci, isolated HTTP/database/recovery and fresh seed plus real-browser role checks. No private provider calls. Documentation: relative-link/placeholder/source review and git diff --check; docs-only changes do not require rerunning unrelated browser cases. Exact hosted CI is recorded separately. Analyze read-only, checklist markers frozen in implement, converge append-only.

## Risks
Pending human review/realGoogle/Gemini/cleanup/TLS/monitoring remain explicit. Retained volumes are inventoried, never deleted. Legacy backend/app.js stays labeled as unmounted legacy until a separately reviewed retirement; real auth tests use production factory from014. Source/version references may differ across independent feature branches; integration report identifies exact selected commits.
