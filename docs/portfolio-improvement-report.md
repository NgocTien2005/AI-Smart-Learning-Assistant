# Portfolio improvement report

Reviewed 2026-11-10. This report covers audit013 and portfolio groups014–020.
The [original audit](portfolio-audit.md) contains severity, affected files,
observed evidence, root cause, solution, regression risks, acceptance and tests
for each finding. Recommendations are not reclassified as confirmed defects.

## Before and after

| Area | Verified baseline / problem | Delivered result | Practical limit |
| --- | --- | --- | --- |
| Architecture | courses router about750lines; large workspace/assignment responsibilities | Focused course/lesson/assignment routers, shared access/document/progress helpers, roster hook and form/editor modules | Preserved APIs/handler behavior; legacy root app remains labeled and unmounted |
| Auth/security | Missing bodies produced500 at production auth endpoints;25 invalid login attempts had no429; reset limiter storage unbounded | Production-router auth regressions, bounded abuse windows, object-body handling, safe error/header assembly, join-code protection | Single-process stores/shared-proxy IP behavior; browser JWT XSS tradeoff remains |
| Frontend | Real390px email input about37.8px; mobile header and assignment grids overflowed | Targeted narrow auth/header/assignment CSS, reduced-motion rules, desktop two-column identity retained | No broad redesign or claim of exhaustive accessibility certification |
| AI correctness | Offline original20-case run failed5 cases: Đ folding, substring overlap and duplicate structured outputs | Token-based matching, correct Vietnamese normalization, normalized duplicate rejection;21 reproducible synthetic cases pass | No actual Gemini response/semantic quality accepted; no private-document transfer |
| Tests/CI | One3260line component suite; auth tests targeted obsolete harness |181 original top-level test/loop statements moved verbatim into feature suites; production auth tested; recovery guard tests and actual synthetic drill in CI | Mock contracts remain distinct from real providers; no coverage weakened |
| Operations | Default proxy logs could include reset URLs, no Compose rotation, no recovery rehearsal | Numeric-only access summaries, native request error suppression, headers, rotation and actual DB/upload restoration | Reduced proxy error detail; no live backup consistency/RPO/RTO, TLS or monitoring certification |
| Portfolio | Scattered/stale capability description and no coherent recruiter guide | README navigation, architecture/ERD/auth/roles, interview/demo guide and traceable report | Review/optional provider/public release gates remain open |

No schema/migration/dependency/lockfile upgrade, public deployment or destructive
database operation was introduced by these improvements. No Google, Gemini or
SMTP request was made during this portfolio batch.

## Feature, task, commit and PR matrix

Paths below point to the actual specification; each feature's verification.md
contains its acceptance/command/evidence traceability. Separate PRs retain small
Conventional Commits. Integration cherry-picks have different SHAs by design;
their dependency mapping is in [integration-review.md](integration-review.md).

| Group / specification | Tasks | Branch | Original meaningful commits | PR/status |
| --- | --- | --- | --- | --- |
| Audit [013](../specs/013-portfolio-audit-roadmap/spec.md) | T001–T005 verified | portfolio/00-audit-speckit | b0b3f62 audit;2891c11 closure | [5](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/5), externally merged into main |
| B [014](../specs/014-auth-abuse-hardening/spec.md) | T001–T007 verified | security/auth-hardening |5eddc22 code/tests;124bf74 evidence;fc219b3 closure | [6](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/6), externally merged into audit branch |
| A [015](../specs/015-architecture-module-boundaries/spec.md) | T001–T006 verified | refactor/architecture-cleanup |86f96c9 routers;bd2bdf8 React;45a31b1 evidence;67610b2 closure | [7](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/7), review pending |
| E [016](../specs/016-production-test-organization/spec.md) | T001–T005 verified | test/quality-ci |fe69d91 organization;dd42554 evidence;c8fc379 whitespace;fef1fea closure | [8](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/8), review pending |
| D [017](../specs/017-ai-grounding-evaluation/spec.md) | T001–T006 verified | feat/ai-quality-improvements |5b6e3ef fix/evaluation;47f2a5a evidence;c13333c closure | [9](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/9), review pending |
| C [018](../specs/018-responsive-accessibility-review/spec.md) | T001–T005 verified | refactor/frontend-ux |c89137f auth;33d7c17 role layouts;35bda2b evidence;8a1495d closure | [10](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/10), review pending |
| G [019](../specs/019-deployment-operation-foundations/spec.md) | T001–T005 verified | chore/deployment-foundations |d61c7c6 proxy;2354639 recovery;4c2f23a guide/evidence;31e90ae CI guards;65148ad closure | [11](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/11), review pending |
| F [020](../specs/020-portfolio-readiness/spec.md) | T001-T005 verified | docs/portfolio-readiness | cf065eb overview/architecture;afd34cf interview/demo;de229b1 report/evidence | [12](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/pull/12), docs-only; base integration-review; review pending |

The agent issued no merge command. External merges of5/6 were observed and
preserved. Local main was not used for implementation or rewritten. The
temporary `portfolio/integration-review` branch combines dependencies for actual
compatibility testing; no combined feature PR into main was created.

## Actual verification, with exact revisions

| Scope | Tested revision / run | Observed outcome |
| --- | --- | --- |
| Security |fc219b3 / [42658072147](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42658072147) | All3 hosted jobs success |
| Architecture |67610b2 / [42659199318](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42659199318) | All3 hosted jobs success |
| Test organization |fef1fea / [42660197641](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42660197641) | All3 hosted jobs success |
| AI grounding |c13333c / [42663857173](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42663857173) | All3 hosted jobs success; no actual model call |
| Responsive UI |8a1495d / [42769021900](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42769021900) | All3 hosted jobs success |
| Operations |65148ad / [42769941342](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42769941342) | All3 hosted jobs success, including real synthetic recovery |
| Combined local |276d03f source, later metadata40dbf67/460b0ab | Frontend npm ci/test/lint/build; backend npm ci/test/quiz/25CIguards; Prisma validate;90HTTP/DB/recovery and247seedHTTP, all exit0 |
| Combined hosted |460b0ab / [42770069065](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42770069065) | All3 hosted jobs success on the integrated code |
| Combined real browser | Same combined code, fresh seed stack |52role views plus16auth views at390/768/1280×800/1440×900; no document overflow; captures inspected |

Frontend retains226 component tests plus5 Node service tests. Offline AI
evaluation has21 original synthetic cases and refuses provider networking. Real
browser observations demonstrate rendered role/view/viewport behavior; actual
assignment grading, quiz lifecycle/concurrency and protected upload/download also
have component/production HTTP evidence. No browser or mock result is presented
as actual provider success. Documentation push de229b1 passed all3jobs in run42771024786. Rows above use direct push events, not PR merge-ref checkout assumptions; full source SHAs, event and job outcomes are in feature020 evidence/hosted-runs.json. Earlier feature reports also include PR-event runs whose headSha identifies the PR source, while checkout may use a merge ref. A previous code SHA is not relabeled as a later docs-only revision.

Failures were retained and corrected: missing runtime/Docker at preflight, one
new operations dynamic-import cycle, targeted layout overflows, an extraction
import oversight, and a whitespace check. No continue-on-error, weakened guard,
fake response, suppressed mandatory failure or lockfile upgrade was used to
obtain green checks. Feature reports distinguish initial failures and final
successful reruns; no unestablished cause is invented for a startup failure.

## Files and engineering decisions

- Backend: production auth router/current-user factory, rate/body/header/error
  middleware; course/lesson/assignment route composition, access/document/progress
  helpers; local retrieval/cloud structured-output validation and evaluation.
- Frontend: focused roster/form/editor modules; split workflow test files and
  shared fixtures; AuthEntry/LearningApp/AssignmentsPanel/App CSS adjustments.
- Operations/CI: Nginx config, Compose rotation, operations-check and target tests,
  integration invocation and backend quality-gate command. Existing pinned
  actions/Node24/permissions/isolated projects remain.
- Documentation: README and this portfolio suite; security/module-boundary/AI/
  CI/operations guides and feature013–020 artifacts/evidence. Use each feature's
  changed-file/commit diff for the full reviewable list, rather than a single
  combined implementation commit.

JWT Bearer storage was evaluated and preserved, with documented XSS and future
cookie/CSRF migration impacts. Shared-proxy IP limiting and process-local state
are explicit constraints. Broad service frameworks, schema changes, new
dependencies, OCR and unrelated AI/product expansion were not introduced.

## Data, SMTP evidence and retained resources

Existing development data and privately configured provider credentials were not
recreated or overwritten. No old SMTP budget was reused. Historical008T023 is
closed from user-observed real mailbox delivery/reset/new-password login/used-link
POST refusal, plus independent old-password/session rejection. A generic200 or
SMTP accepted is not substituted for that evidence. Current provider readiness
does not invalidate the historical acceptance.

Fresh portfolio test projects had their own networks/volumes/secrets and scoped
row cleanup; containers/network were stopped. **13 exact portfolio projects /26
named volumes** are retained, inventoried in
[local retained resources](../specs/020-portfolio-readiness/evidence/local-retained-resources.json).
Source application users are0 after cleanup. Seed stacks retain synthetic files;
operations stacks additionally retain one source fixture row, one restored copy
in the new named restore DB and one upload fixture. Earlier pre-portfolio
resources remain separately documented in
[feature012 inventory](../specs/012-demo-cloud-assistant/evidence/local-retained-resources.json).
No volume or historical blocked profile was deleted. Archives inside removed
container writable layers were not published.

Combined local acceptance projects:

- `lumina-acceptance-ci-1794292705527-bea45e21`: actual DB lumina_acceptance,
  restore DB `lumina_restore_8222c1779e503e9a`,90HTTP ops and recovery pass.
- `lumina-acceptance-ci-demo-1794292732868-817a63`:247HTTP ops,18seeded users
  cleaned,26synthetic documents retained, real Chrome matrix pass.

## Remaining work and precise closure conditions

| Item | Current status | Required next action / evidence |
| --- | --- | --- |
|001–007| Historical175/175 plus preserved production regressions | Retest when affected source/environment changes; checkbox totals alone are not evidence |
|008T023| Closed, user-confirmed real email chain preserved | New sends require new explicit recipient/budget/setup; do not reopen for present config issues |
|008T026| OPEN, automatic approval review blocked historical browser-profile cleanup | Leave files untouched; only a valid permitted cleanup outcome can close it, never an alternate bypass |
|010T016| OPEN, real Google acceptance | Private Client ID and actual origin/provider setup; user performs explicit link/sign-in and reports outcomes |
|012T012| OPEN, real Gemini output/quality acceptance | Privately configured free/no-billing project, permitted synthetic source/actions, actual four-action outputs and human groundedness review |
|Feature PRs| Review pending as linked above | Human review/merge decisions; rebase/integrate and rerun exact-revision gates against chosen main |
|Production release| NOT READY / not deployed | Domain/TLS/CORS/proxy, secrets/least privilege, durable state/limits, consistent backups and RPO/RTO, monitoring, advisories/load and release/rollback rehearsal |

These original blockers remain in their original features; no duplicate
convergence task is created in the portfolio features. The next recommended
step is human review of the separate implementation PRs, then optional real
Google/Gemini acceptance with private configuration. Public deployment is a
separate authorized task, not an automatic consequence of passing CI.

## Final portfolio delivery

All44tasks across013-020 are verified within their bounded scope. Feature020 documentation commits cf065eb/afd34cf/de229b1 are on docs/portfolio-readiness; PR12 targets the explicit integration branch. [Documentation hosted run42771024786](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42771024786) passed frontend/backend/HTTP-database jobs atde229b1. Later evidence-only closure commits remain separately identifiable; no unobserved HEAD success is implied. Final read-only analyze found no uncovered requirement; converge found no new actionable task and did not rewrite existing tasks. Original three blockers and public-release limits remain open.
