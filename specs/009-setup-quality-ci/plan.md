# Implementation Plan: Automated Lumina quality checks

**Feature**:009-setup-quality-ci | **Date**:2026-11-03 | **Spec**:[spec.md](spec.md)
Official resolver selects009; Git branch and feature directory are independent.

## Summary
Add three independent GitHub Actions jobs and dependency-free Node helpers that run existing package commands and the production integration harness. Keep old acceptance tasks separate. All application/auth/UI/schema/dependency files remain unchanged.

## Technical Context
- GitHub-hosted ubuntu-24.04 x64; explicit Node24. Existing npm lockfiles, Vitest/Node tests and Docker Compose remain authoritative.
- Workflow:pull_request, push (all branches), workflow_dispatch; contents:read; no persisted checkout credentials, deployment, privileged PR event or external secret requirement.
- Release SHA pins:checkout7.0.1, setup-node7.0.0, upload-artifact7.0.0 verified against official repository tags/action.yml; research.md records exact commits.
- Three jobs run independently with bounded timeouts. No path filters or continue-on-error. A failed dependency install skips dependent commands explicitly; later checks after a test failure may still run but cannot erase it.
- Node built-ins only for helpers/test harness. No root package/workspace or new npm dependency.

## Constitution Check
| Principle | Pre/post-design gate |
| --- | --- |
| I Contract | PASS:existing UI→SessionContext/API→production src/app.js/auth routes→Prisma traced; production integration harness retained. backend/app.js remains legacy. |
| II Authorization | PASS:real HTTP suite checks role/ownership/enrollment and session revocation; no ADMIN content bypass. |
| III Recoverability | PASS:auth UI/state unchanged; workflow preserves failed/cleanup outcomes and explicit missing evidence. |
| IV Evidence | PASS:command/cwd/exit/revision/target; typed local/hosted/mail evidence; hosted acceptance remains open until actual run. |
| V Integrity | PASS:baseline preserved, fresh isolated writes only, no old volumes/profile deletion or production/schema/dependency changes. |
No exceptions.

## Design Decisions
1. .github/workflows/ci.yml has frontend/backend/integration jobs on ubuntu-24.04, explicit Node24 and pinned official actions. Package caches use their own lockfile; credentials are not persisted. Seven-day evidence retention, upload on success/failure, exact non-hidden ci-results paths only.
2. scripts/ci/common.mjs runs child processes without shell interpolation, with deadlines and cancellation. Resolve npm's installed CLI using the current Node installation for Windows/Linux. Suppress raw child output in persisted evidence; record approved command, cwd, duration and exit status only. No arbitrary command input is accepted by the public helpers.
3. scripts/ci/check-package.mjs executes npm ci then frontend test/lint/build or backend full/quiz/helper regression. Both packages run with an empty dotenv config path; backend uses a fresh test JWT and non-routable test database URL so host secrets/config are not consumed. Summary survives failed commands. Root helpers do not introduce a root npm workspace.
4. scripts/ci/integration.mjs generates a random per-run project prefixed lumina-acceptance-ci-, chooses/verifies an unused loopback port, and refuses existing containers/networks/volumes before Compose. Reuse compose.acceptance.yaml with explicit empty env file; fresh DB/JWT secrets stay in process. Check a local Linux Docker endpoint, then build/up --wait --wait-timeout180. Do not invoke resolved Compose config.
5. Before business writes, reuse backend/scripts/integration-target.mjs to verify actual healthy project/labels/network/mounts/HTTP/backend DB address, then health and empty User count. Existing integration-check.mjs owns provisioning and row cleanup; no production contract change. Check its evidence has zero remaining users and export only whitelisted fields. A missing/corrupt record fails verification.
6. Lifecycle finally attempts scoped Compose down only after this run's fresh-project gate and start attempt, validates project ownership before cleanup, and omits -v / broad orphan removal. Preserve primary and cleanup failures; interruption gets best-effort cleanup and nonzero status. A hard runner termination cannot guarantee finalizers; unique identity and ephemeral hosted runner contain residual resources. Local named volumes remain for review, never auto-reused.
7. scripts/ci/test/ci.test.mjs covers safe failure propagation, dependency skips, cancellation/cleanup failure, project/port validation, reused-resource rejection, evidence allowlisting and no-secret export. These are runner safety checks, distinct from real HTTP/database proof. Existing integration-target regression already covers HTTP/database mismatches.
8. docs/continuous-integration.md and README.md explain commands, safe outputs, first hosted run, retained-volume behavior and source evidence limits. Preserve008 T023/T026 in place. Review prepared SMTP launcher, probe only configuration readiness; no mail without externally supplied config and explicit recipient/send scope. SMTP and blocked profile cleanup do not gate independent CI work.

## Project Structure
- .github/workflows/ci.yml
- scripts/ci/{common.mjs,check-package.mjs,integration.mjs,test/ci.test.mjs}
- docs/continuous-integration.md; README.md; .gitignore (ci-results only)
- specs/009-setup-quality-ci/{spec,plan,research,data-model,quickstart,tasks,verification}.md;contracts/ci-runner.md;traceability.csv;checklists/
- Ignored local evidence:.artifacts/ci-20261103/ and ci-results/. No browser run needed because UI/source is unchanged.

## Verification and Risks
Validate workflow with official actionlint Docker image1.7.12; quiet/no-interpolation Compose schema validation. Run helper safety regressions; execute the same package helpers locally with clean npm ci and record host Node version. Verify a Linux Node24 run with source-filtered temporary verification image where practical; never copy .env/generated/dependency directories as source.
Run integration helper on a new verified local Docker project, record IDs before suite, resource IDs and zero users afterward; retain old stack identity/mount snapshots. Use generated non-application sentinel secrets only in runner unit tests to prove they cannot enter exported records. Do not upload raw logs or private state.
First GitHub-hosted run remains an explicit open task because no push is authorized. Changes to action/runner versions can require future validation; pinned actions and explicit platform keep this implementation reviewable. SMTP transport readiness and mailbox receipt are separate operational blockers under008.

## Continuation details — 2026-11-05

Preserve existing artifacts and resume009 rather than allocate a second feature.
Integration needs backend dependencies on its independent runner:the fixed
`integration-deps` package-helper mode executes backend `npm ci` and writes a
separate allowlisted summary. Its installation failure skips integration; it
does not conceal a required failure. Workflow assigns the integration step an
ID so skipped integration does not claim missing execution evidence. HTTP
evidence upload requires its file to exist, including a suite pass followed by
cleanup failure; summary remains mandatory for every attempted group.

Before each integration attempt remove only previous public `summary.json` and
`http.json`; preserve private/local files. Export known mounted `/api` endpoint
paths (including singular submission/plural submissions) and known fetch error
types only. Docker host/context ambiguity is refused. Linux child process groups
receive termination with a forced deadline fallback. Regression tests exercise
these boundaries without production mutation. No application code or contract
change is needed. Current evidence directory is `.artifacts/ci-20261105/`.

Publication follow-up2026-11-05:the user subsequently authorized feature-scoped
commits/pushes. The first hosted push run42060354382 passed all three jobs for
6046690and its allowed artifacts were validated; T018 is closed. This changes
the previously external execution condition, not the implementation design.
See verification.md for revision, results, evidence limits and008open tasks.
