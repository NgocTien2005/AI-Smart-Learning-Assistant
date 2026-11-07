# Verification: Lumina CI

**Acceptance update after user confirmation — 2026-11-07:**009remains18/18.
008is now25/26:its T023 is closed on explicit private email/UI user attestation
combined with prior HTTP revocation proof; only T026 remains open. This is008
evidence, not a CI/mailbox test. The latest completed hosted push at this
snapshot is82a1970, [run42358674146](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42358674146),
all three jobs PASS. Its86HTTP operations/cleanup0 are distinct from email
acceptance. Older T023-open/count statements below are historical snapshots.

**Current review — 2026-11-07:** **18/18tasks**. The subsequent published
revisionef3cbf1 also passed all three actual hosted jobs in
[run42061961868](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42061961868).
The status was queried again during this read-only MVP audit. Current local
Docker is unavailable; no new local integration/mail/browser run is claimed.
See [MVP handoff](../../docs/mvp-handoff.md) and
[production readiness](../../docs/production-readiness.md).008remains24/26.

Date:2026-11-05 (Asia/Bangkok). **Local checks and GitHub-hosted push run PASS;
feature009 has18/18 tasks closed.** Hosted evidence for revision6046690 is
recorded in the final section below. Earlier NOT RUN/no-push statements are
historical local-phase evidence. Feature008 T023/T026 remain owned there and
open. The user authorized feature-scoped commits/pushes afterward; no PR,
merge or deployment performed.

## Baseline, scope and workflow

Official resolver selects `specs/009-setup-quality-ci`; existing artifacts and
helpers were present before this continuation. No new feature number, manual
feature-state edits, init, upgrade or constitution rewrite. HEAD remains
`df570a152e29c4c9cc9efdec01c00a78a492a919`; this hash alone does not identify the
dirty source. `.artifacts/ci-20261105/baseline.json` captures261 file hashes,
working-tree state and task counts before edits. Original uncommitted008 UI,
tests/helpers and the `.gitignore` change were preserved.

Fresh recount:001–007175/175closed;00824/26, T023/T026 open. No previous task
transferred into009. Installed CLI1.2.3/integration manifests remain intact.
Read AGENTS, constitution, development workflow and prior acceptance reports.
Managed specify→clarify→plan→checklist→tasks continued existing artifacts,
then analyze(read-only)→implement→lumina-verify→analyze(read-only)→converge
(append-only assessment). No extensions.yml or applicable hooks. Plan's
official-source research agent performed read-only research only.

Clarify found no unresolved product decisions; no invented user answers.
Existing requirements checklist16/16 and reviewer CI checklist12/12 were
re-evaluated against requirements, then kept byte-identical during implement.
Checklist approval is not runtime evidence. No duplicate generation of feature,
checklists or original18tasks.

## Delivered files and behavior

- `.github/workflows/ci.yml`:three independent jobs, PR/push/manual triggers,
  Ubuntu24.04/Node24, official full SHA action pins, contents:read,
  persist-credentials:false,20/20/30minute deadlines, no continue-on-error.
- `scripts/ci/common.mjs`, `check-package.mjs`, `integration.mjs` and
  `test/ci.test.mjs`:fixed command groups, sanitized command results, own process
  deadlines/cancellation, fresh target guards, scoped cleanup and safe evidence.
  Integration's independent backend install has a separate summary.
- `docs/continuous-integration.md`, README CI section and009 artifacts explain
  reproduction, exact upload allowlist/7day retention and evidence limits.
  `ci-results/` was already ignored at baseline and remains unchanged.
- Feature008 verification/traceability receive only the current SMTP condition;
  auth pages, shared session/client, backend production/legacy code, schema,
  migrations, lockfiles/dependencies and two-column presentation stay unchanged.

Official action pins and runtime inputs were independently verified against
release/tag/action.yml sources recorded in [research.md](research.md).

## Command evidence

Evidence root: **.artifacts/ci-20261105/** (ignored). Package JSON summaries
contain every child command's cwd, duration and real exit code; no raw child
stdout/stderr. Host Node25.2.0/npm11.6.2; Linux Node24.22.2. Docker29.3.1,
Compose5.1.1. Docker initially unavailable; Desktop started hidden, with no old
container recreation. This initial unavailable probe is retained as an
environment finding, not an application failure.

| Environment / cwd | Command/check | Exit | Evidence / outcome |
| --- | --- | ---: | --- |
| Windows root → frontend/ | `node scripts/ci/check-package.mjs frontend`:npm ci/test/lint/build |0 each|frontend-host.json; full suites passed |
| Windows root → backend/ | `node scripts/ci/check-package.mjs backend`:npm ci/full test/quiz/helper tests |0 each|backend-host.json; no narrower pass substituted |
| Windows root → backend/ | `node scripts/ci/check-package.mjs integration-deps`:npm ci |0|integration-deps-host.json |
| root | `docker run --rm -v <repo>:/repo:ro -w /repo rhysd/actionlint:1.7.12 -color .github/workflows/ci.yml` |0|workflow-validation.json; no diagnostics |
| root, filtered build context | `docker build --progress plain --tag lumina-ci-verify:20261105 .artifacts/ci-20261105/linux-source` |0|linux-build.log; frontend-linux.json/backend-linux.json:all required package commands passed on Node24 |
| Linux /repo | final scripts mounted read-only; `node --test scripts/ci/test/ci.test.mjs` |0|helpers-linux-final.log/json;22/22 PASS, network disabled |
| Windows root | `node scripts/ci/integration.mjs` first attempt |1|integration-first-failed.json;suite0/down0, evidence export failed |
| Windows root | `node scripts/ci/integration.mjs` corrected attempt |0|integration-summary.json/integration-http.json;86 HTTP operations,33 resource records,0 remaining users |
| root | same local8081 identity/mount/network/port inspection before/after |0|environment-before.json/environment-after.json;unchanged |
| root | `git diff --check`; `specify integration status --json` |0|no whitespace error;0 missing/modified managed files |

The Linux image was built from113 explicitly copied application/helper files,
excluding `.env*`, generated/dependency/upload directories and profiles. Its
source manifest is linux-source.json. It has no Git metadata, so revision is
honestly `unavailable` in its summaries; manifest hashes identify copied source.
Application/package-command code matches the current tree. The subsequent
mounted final runner tests cover the final evidence-filter/setup changes;
the image's initial helper regression had21cases, final runner has22. No claim
that the earlier image included the later helper fixes. This is local Linux
Docker verification, not a GitHub-hosted run.

## Retained failures and safety checks

Historical helper red run2026-11-03 remains in its original evidence directory.
Fresh red logs record missing new exports, the not-yet-supported integration
dependency mode and the production evidence-path regression. Green runner tests
cover failed full-suite retention, failed-install skips, deadline/cancellation,
unsafe/reserved/occupied port, reused project containers/networks/volumes,
no startup/cleanup on refused target, startup failure cleanup, simultaneous
primary+cleanup failure, missing/unclean/mismatched evidence, stale evidence
removal and sensitive-field/path/error rejection. Sentinel strings in tests
are invented test values, never live credentials.

First live suite succeeded but evidence filter initially omitted mounted `/api`
and actual assignment submission paths; runner correctly failed rather than
claiming complete proof. Added a failing production-path regression, corrected
allowlist and ran a new isolated project. The first failure and its successful
scoped shutdown remain recorded. This was a CI harness defect; no application
bug or API change was needed. An evidence-log parser initially assumed UTF8 for
a PowerShell UTF16 log; failed parsing was replaced by reading the safe JSON
summaries from the verification image. Neither failure is hidden by later pass.

Existing backend integrationTarget tests reject missing/nonloopback/credential
URLs, mismatched labels/networks/mounts/HTTP binding/health and wrong backend
database name/address before provisioning writes. Those unit proofs are distinct
from the two actual production HTTP/database runs.

## Integration target, provisioning and cleanup

Final project:`lumina-acceptance-ci-1793890323284-2550aee7`.
HTTP:`http://127.0.0.1:56018/api`. Database/user:`lumina_acceptance`.
Container IDs are retained in integration-summary.json before provisioning.
The guard executed inside backend to compare actual Prisma database/server
address with the selected DB container network, plus labels, health, own
network/mount prefixes and frontend loopback binding. HTTP health succeeded;
User count was0 before business writes. Fresh runtime DB/JWT secrets, empty env,
no SMTP configuration, production credentials or host `.env` input.

The existing production suite provisioned its own accounts and LMS resources,
including an ADMIN fixture;86 HTTP records cover public role restrictions,
`/me`, auth/session/reset/change-password, course/enrollment authorization,
lesson/document/size limits, progress, assignment/grading concurrency, local
assistant, quiz draft/version/submission and course cascade deletion. IDs are
in integration-http.json. Reset tokens are fixtures, not email delivery.

Suite cleanup reported0 remaining owned accounts; total User count also0
before shutdown. Runner verified ownership, then removed only this project's
containers/network with down, no -v. Its two named volumes remain:
`lumina-acceptance-ci-1793890323284-2550aee7_postgres_data` and
`lumina-acceptance-ci-1793890323284-2550aee7_uploads_data`.
The first failed-export project's two volumes also remain under
`lumina-acceptance-ci-1793890226489-c01b7134_*`; its containers/network were
shut down successfully and suite cleanup was0. No volume was removed/reused.
Local verification image `lumina-ci-verify:20261105` remains for review.

Local8081's three container IDs, mounted named volumes, networks and HTTP
binding are byte-identical in public before/after metadata. No SQL or writes
were issued against it. No reset/drop, old-volume removal or browser/profile
cleanup. Hard termination remains a finalizer limitation; unique project and
ephemeral hosted runner limit residual scope.

## Auth and SMTP evidence boundaries

Traced AuthPage/ResetPasswordPage→SessionContext/services/api→server.js→
src/app.js→auth.js→email.js Gmail transport→Prisma User. Email normalization,
untrimmed password validation6–72, public STUDENT/INSTRUCTOR only, three-role
verified routing, generic forgot response, separate validation/invalid-link400,
conditional single-use reset and authVersion session revocation remain intact.
Uncertain password mutations are not replayed. No OAuth/magic link/OTP/email
verification, production API/schema/policy or UI change was introduced.

User elected private SMTP setup but has not yet supplied confirmed readiness,
permitted recipient and send scope. The selected SMTP test project was absent
at the recorded readiness probe. No credentials or Docker environment read,
no mailbox accessed, no real email sent and no reset URL/token collected.
T023 remains OPEN/NOT RUN in008. SMTP accepted/generic200/DB fixture cannot
close it. T026 remains policy-blocked, along with the documented additional
visual-test profile limitation; no cleanup retry or bypass attempted.

## Traceability and remaining acceptance

[traceability.csv](traceability.csv) covers17FR,14AC and8SC with task/evidence
type/status. Local implementation/verification tasks T001–T017 are supported
by the records above and final analysis. **T018 remains OPEN**:requires a later
authorized publication and actual GitHub-hosted run for the delivered revision,
recording URL/SHA/event and all three job outcomes. Trigger/actionlint inspection
only verifies configuration, not hosted execution. No branch protection or
public deployment configured. Feature008 remains24/26, independently of CI.

Final analyze/converge and source-integrity results are recorded below after
their read-only/append-only assessments. No completion claim can replace the
outstanding hosted or mailbox evidence.

## Final analyze, converge and integrity

Managed analyze used official RequireSpec/RequireTasks/IncludeTasks prerequisites
with no-persist overrides for008 and009. Both resolved correctly; state stayed
009. Artifacts/state were byte-identical during analysis.009:17FR/8SC/14AC,
18tasks,39/39 trace rows covered;008:19FR/8SC/23AC,26tasks. No unmapped
requirement/task, unresolved design ambiguity, actionable duplicate or
critical/high constitution inconsistency. All5principles checked. Outstanding
hosted/mail/cleanup conditions are explicit tracked gaps, not requirement fixes.

Converge assessed17FR/8SC/14AC,8plan decisions,5principles and all18existing
tasks against current implementation. No new code gap/unrequested behavior;
0tasks appended. Hosted execution is partial and already tracked by T018, so
no duplicate blocker was appended and no complete acceptance claimed. Task
bytes stayed unchanged during converge; SHA256
`333573165dba72adb5c3b63e9f057a33a1150fccb1169b5d742b3be4b2a6077d`.
Spec/plan/constitution/state also unchanged in the step. T017 is marked done
afterward, outside converge. Final009 status:**17/18, T018 OPEN**. No unchanged
convergence loop for008; its T023/T026 remain open.

Final CLI safety probe runs final scripts inside the source-filtered Linux
verification image, without network or Docker socket. An invalid local8081
project causes expected exit1/setup failure, records0commands and removes
stale HTTP evidence. `invalid-target-cli.json` records this expected negative
result; no provisioning/cleanup target was reached. Final runner22/22 pass
on Linux. Setup-boundary adjustment does not alter the already exercised
production suite/verified lifecycle; no redundant live rerun was required.

`source-integrity.json` compares261baseline hashes with explicitly permitted
paths:245protected files unchanged,0unexpected change; both009checklists match
their frozen2026-11-03SHA256. All frontend source, backend/source/tests/schema/
migrations, manifests/locks, managed tooling/constitution and001–007 artifacts
remain preserved.008task/checklist markers and its presentation remain intact.
Only008verification/traceability gained current SMTP conditions.

No fresh UI/browser run was needed because application UI/source was not
changed. Prior008desktop evidence remains separately labelled historical;
current frontend package checks are fresh. Logs/summaries, source manifests and
public resource IDs stay in the ignored evidence root; workflow upload paths
exclude it and every private/hidden directory. No email/profile cleanup or
hosted run is implied by these results.

## Publication follow-up — 2026-11-05

The user subsequently authorized small feature-scoped commits and pushes to
the configured remote. The earlier no-push constraint and NOT RUN statements
describe the prior local implementation phase. This follow-up publishes009
after008and permits its push-triggered hosted checks. Source hashes match the
recorded local passing package/integration/runner checks; documentation changes
do not imply a new source test run. T018 stays OPEN until an actual hosted run
for the published implementation is observed and recorded. Feature008T023/T026
remain separate and open; no real email is sent by CI. Ignored evidence, env,
profiles and secrets are excluded. No PR/merge/deployment requested.

## First GitHub-hosted verification — 2026-11-05

[Run42060354382](https://github.com/NgocTien2005/AI-Smart-Learning-Assistant/actions/runs/42060354382)
completed successfully for **6046690034326b6d0c6e164986069007758882ce**, event
**push**, branch **main**, workflow **Lumina CI**. The implementation is the
same source already checked locally; publication separates008implementation
and evidence from009runner/workflow and documentation. The first four commits
are f3a1c36,4530fe7,b97e93e,6046690. No force push or application change.

| Hosted job | Result | UTC execution | Required checks |
| --- | --- | --- | --- |
| Frontend |PASS|15:58:24–15:59:13|npm ci/test/lint/build, each exit0 |
| Backend |PASS|15:58:24–15:58:57|npm ci/full test/quiz/runner safety regression, each exit0 |
| HTTP and database integration |PASS|15:58:23–15:59:42|backend npm ci, isolated Compose build/health/target verification, production suite and scoped shutdown, each exit0 |

Downloaded only the five named allowlisted artifacts into ignored
`.artifacts/publish-20261105/hosted-42060354382/`. Exact extracted file paths
are frontend-outcomes/summary.json,backend-outcomes/summary.json,
integration-dependency-outcomes/summary.json,integration-outcomes/summary.json
and integration-http/http.json. All summaries identify the reviewed revision,
GitHub-hosted checkout, Linux and **Node24.22.2**. Commands/cwd/duration/exit
were checked. Artifact metadata confirms7day expiration (2026-11-12); no
additional artifact or hidden/private file was uploaded. HTTP/resource entries
contain only allowed metadata fields. No raw logs/authenticated exchanges,
env, credentials, reset links/tokens or browser profiles downloaded/exported.

Hosted project:`lumina-acceptance-ci-1793894322089-5eb444b3`;
HTTP:`http://127.0.0.1:44805/api`; database:`lumina_acceptance`.
Actual backend target verified before provisioning; suite recorded **85HTTP
operations/32resource records/0remaining owned users**. The count differs from
the earlier local86/33 because the suite conditionally retries concurrent
submission/grading outcomes; this is not a missing required command. Scoped
shutdown succeeded, primary failure null, no named-volume removal. These
resources belonged to the hosted runner; no local8081/SMTP stack action.

Public run/job metadata and validated summaries are recorded in ignored
hosted-run.json and hosted-evidence-validation.json under the publication
evidence root. T018 is now satisfied by this actual first hosted run and is
marked closed outside any converge operation. **Feature009:18/18**. Traceability
updates distinguish actual hosted push execution from inspected PR/manual
configuration; no actual PR/workflow_dispatch run is claimed.008 remains24/26
with T023/T026 open, and no additional email was sent. No PR/merge/deployment.

The subsequent documentation-only commit records this completed run. Its
push-triggered verification is checked separately without rewriting the tested
implementation or claiming evidence for an unobserved revision.

Post-hosted managed analyze was read-only:17FR/8SC/14AC,39/39 trace rows and
18/18tasks,0unmapped or critical/high inconsistency. Managed converge assessed
8plan decisions and5principles against current files and hosted evidence:
**converged**,0findings/0tasks appended. Spec/plan/tasks/constitution/state
remained byte-identical during converge; tasks SHA256
`3dfb0da59cea625658c577c01bc10308eaba8ed4b038717ca886be71e2240f4a`.
Hooks absent. Checklist markers unchanged. This follow-up records the closed
hosted condition and does not repeat008's unchanged external blockers.

## MVP handoff review — 2026-11-07

Baselineef3cbf1 was clean and already published. Querying actual
run42061961868 confirms headShaef3cbf1, completed/success and all three jobs
successful:frontend127365891552, backend127365774366 and HTTP/database
integration127365773276. This is a subsequent push run, separate from the first
run42060354382 recorded above. No PR/workflow_dispatch execution is claimed.
No old success is attributed to a not-yet-published documentation revision.

Official no-persist prerequisites still resolve009from stored state; process
override resolves008without changing that state. Spec Kit1.2.3 integration
status reports zero modified/missing managed files; extension hooks are absent.
Built-in16/16/custom12/12 gates remain read-only. Pre-edit analyze covered
17FR/14AC/8SC,18tasks with full coverage, zero unmapped009tasks or CRITICAL/HIGH
issues and no core/state byte changes during analysis. Spec status wording and
historical no-publication traceability wording were updated under the user's
explicit remediation/publication authorization; requirements/design did not
change. Tasks/checklists and001–007artifacts remain unchanged.

All application/CI/Docker/schema/lockfile source matches the passing hosted
revision, and seven008auth source hashes match their latest manifests.
Current audit evidence is ignored `.artifacts/mvp-handoff-20261107/` with
command/cwd/exit/source hashes; older fixture hash limitations are disclosed in
[MVP handoff](../../docs/mvp-handoff.md). No app bug was reproduced or source
modified in this documentation follow-up. No extra local full suite/browser
run is required for these documentation-only edits.

Current Docker probe exits1 because the Linux engine pipe is unavailable.
No local integration or current SMTP readiness is claimed;008historical
configured:true cannot stand for current readiness/delivery. Its T023 stays
OPEN/PARTIAL (1of3attempts used), and T026 remains policy-blocked. No email,
test data, old stack/volume or profile mutation occurred. Branch main currently
reports protected:false; [production readiness](../../docs/production-readiness.md)
records the remaining deployment-specific decisions without changing settings,
creating a feature or adding prior blockers as CI tasks.

Managed converge assessed17FR,8SC,14AC,8plan decisions,5constitution principles
and18tasks against current scoped code/evidence: **converged**,0findings and
0tasks appended. Spec/plan/tasks/constitution/state hashes stayed unchanged
during convergence; no Git operation occurred inside that assessment.008was
not rerun through unchanged convergence and no duplicate blockers were created.

Documentation verification:8allowed files;22new local links/anchors;
23auth/39CItraceability rows retain required IDs;116source files and65protected
artifacts unchanged; status metadata is the only009spec change. Scoped secret
checks found no new mailbox/token/key literal and `git diff --check` passed.
An initial local checker exit1 on unchanged README mailbox examples was
diagnosed and corrected without weakening token/key checks; both attempts are
retained. Evidence:ignored mvp-handoff-20261107/verification.json,
verification-attempts.json and converge-009.json. Later actual hosted outcomes
for the documentation publication must be checked against its own SHA; these
older passing runs are not substituted for that future result.
