# Research

Date2026-11-03; installed Spec Kit1.2.3. Baseline HEAD df570a152e29c4c9cc9efdec01c00a78a492a919 with existing uncommitted008 changes preserved.001–007:175/175closed;008:24/26, T023/T026 open. No workflows exist at baseline.

## Decisions and sources
- Decision:Node24 on ubuntu-24.04, separate package working directories and lockfile caches. Rationale:AGENTS and Dockerfiles already require/use24; no application upgrade. Alternative:runner default Node or a new root workspace rejected. [Node setup](https://github.com/actions/setup-node), [runner inventory](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md).
- Decision:pin checkout v7.0.1=3d3c42e5aac5ba805825da76410c181273ba90b1; setup-node v7.0.0=820762786026740c76f36085b0efc47a31fe5020; upload-artifact v7.0.0=bbbca2ddaa5d8feaa63e36b76fdaad77386f024f. Rationale:official tags and action.yml verified; all use node24. Alternative:moving major refs omitted. [Checkout release](https://github.com/actions/checkout/releases/tag/v7.0.1), [setup release](https://github.com/actions/setup-node/releases/tag/v7.0.0), [upload release](https://github.com/actions/upload-artifact/releases/tag/v7.0.0).
- Decision:pull_request/push/manual with contents:read and persist-credentials:false; no privileged PR event. Rationale:tests need no repository writes or production secrets. [Workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [security](https://docs.github.com/en/actions/reference/security/secure-use).
- Decision:exact non-hidden evidence paths, seven days retention, no browser/private directories. Rationale:upload-artifact excludes hidden content by default; using ci-results avoids enabling hidden uploads. Alternative:upload whole .artifacts or raw logs rejected. [Upload documentation](https://github.com/actions/upload-artifact).
- Decision:Compose up with health wait plus actual backend database identity guard; finally scoped down without -v. Rationale:Compose health alone is not a business contract/DB-target proof; target helper already supplies the latter. Alternative:HTTP-only override or shared DB rejected. [Compose up](https://docs.docker.com/reference/cli/docker/compose/up/), [down](https://docs.docker.com/reference/cli/docker/compose/down/).
- Decision:actionlint1.7.12 via its official Docker distribution for workflow validation; no application dependency. [Official usage](https://github.com/rhysd/actionlint/blob/main/docs/usage.md#docker).

## Repository contract and documentation comparison
frontend/src/pages/AuthPage.jsx and ResetPasswordPage.jsx use SessionContext/services/api.js and production /api/auth. backend/server.js imports src/app.js; src/routes/auth.js uses authenticate/email/Prisma User. backend/app.js is legacy auth-only and cannot prove production reset or session revocation.
README.md currently documents three-role email/password login, only two public registration roles and generic forgot results correctly. Existing two-column auth UI is accepted as baseline; no new documentation/code contradiction found. README currently has no CI section, so this feature adds usage rather than asserting a previous pipeline existed.
Gmail transport remains services/email.js; generic200 covers unknown/cooldown/delivery-failure branches. No configured test mailbox/send scope exists in current acceptance evidence. Actual SMTP delivery/reset stays008 T023, not a new CI implementation requirement.

## Clarify report
Zero questions:all functional, data/lifecycle, interaction, security/reliability, integration, boundary, failure, terminology and completion categories are clear. External SMTP/hosted-run conditions are explicit operational prerequisites, not unresolved product-design choices. No fabricated user answers. Research agent was dispatched as required by managed plan; primary official sources verified.

## Continuation — 2026-11-05

Official PathsOnly resolver and setup-plan/setup-tasks select the existing009;
no second CI feature created. Baseline `.artifacts/ci-20261105/baseline.json`
captures261 source/artifact hashes and the complete dirty-tree status before
edits. Existing CI helpers/design artifacts and008 changes were already present.
Fresh recount:001–007175/175;00824/26(T023/T026);0090/18 before continuation.
Existing red helper evidence from2026-11-03 is retained as historical evidence;
this continuation separately records its own red/green regressions.

Read installed specify/clarify/plan/checklist/tasks/analyze/implement skills
before their respective continuation steps. No extension hooks file exists.
Specify/clarify:existing spec covers the request, all ambiguity categories clear,
zero questions, no spec rewrite. Plan setup preserved existing plan. Official
checklist prerequisite and tasks setup validated paths/templates; existing
reviewed checklists remain16/16 and12/12 with frozen hashes. No duplicate
checklist/task generation. Analyze uses no-persist and remains read-only.

Managed plan's research agent independently rechecked official release commits,
action.yml Node24 runtimes, workflow permissions/events/artifacts, Node/npm and
Compose references above. All three SHA pins match; no dependency upgrades.
Official setup-node/upload READMEs contain some older-version snippets, so exact
pinned action.yml/release metadata controls inputs/runtime. Additional sources:
[npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/),
[project isolation](https://docs.docker.com/compose/how-tos/project-name/),
[workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

Design refinements within plan:integration job installs backend harness dependencies
using an `integration-deps` mode with its own sanitized summary; it does not
depend on the backend job. Export only known mounted `/api` endpoint paths and
known fetch error classes. Remove stale public evidence before each attempt.
Refuse conflicting Docker host/context overrides and stop owned child process
groups on Linux deadlines/cancellation. Focused tests cover these cases.

Host Node25.2.0/npm11.6.2 differs from workflow Node24. Docker was stopped at first
probe; started Desktop hidden, without recreating/touching old Lumina containers.
Current engine29.3.1/Compose5.1.1. Actual local8081 container/mount identities
captured separately. Older acceptance containers are not assumed present from
historical reports. No host frontend `.env`, `.env.local`, `.env.test` or
`.env.production` exists; only existence was checked. Linux verification uses
source-filtered copies excluding all `.env*`, dependencies/generated/uploads.

SMTP launcher reviewed as setup-only:prompts secrets privately, new project,
empty env and fresh DB/JWT, no accounts/mail. Its label-only reuse guards and
fixed8084 mean it must not be reused blindly; independently verify actual target
before any write. User elected to configure privately; recipient/send budget
and successful readiness must still be explicitly supplied. No mailbox guessed,
email sent or previously blocked profile cleanup retried by this work.
