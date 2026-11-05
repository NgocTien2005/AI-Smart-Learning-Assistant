# CI runner contracts

- node scripts/ci/check-package.mjs frontend|backend:fixed existing package commands only; writes ci-results/<package>/summary.json; exit0 only when every required command passed. Failed install explicitly skips dependent commands. Raw output/credentials are excluded from the persisted summary.
- node scripts/ci/integration.mjs:no target URL argument; allocates a fresh lumina-acceptance-ci-* project and unused loopback port. Optional CI_TEST_PROJECT/CI_TEST_PORT support explicit local reproduction, subject to fresh-project/port validation; they do not bypass backend DB checks. Existing resources cause refusal with no Compose create/down or suite writes.
- Integration lifecycle:local Linux Docker endpoint→fresh resources→empty env file→runtime secrets→Compose health→integration-target.mjs→health/empty DB→production suite→allowlisted evidence/zero owned users→scoped shutdown. No down -v, secret-env inspect, broad orphan cleanup or real mail.
- Public output allowlist:job/revision/runtime, approved command/cwd/duration/exit, project/HTTP/database/containers/own resource identifiers, cleanup and missing-evidence outcomes. Integration HTTP export accepts only method/path/status/failure, kind/id and owned-user count. No body, headers, query strings, token/hash/credentials, environment file or browser content.
- Workflow upload paths are exact summary.json files and integration/http.json only, seven-day retention. Missing expected evidence is a failure, not an implied pass. Package job artifacts must not include node_modules/dist/generated output.
- Existing /api/auth, password/reset/session/role contracts are unchanged; real SMTP acceptance remains008 T023. GitHub-hosted execution is a distinct final gate, not implied by local commands or workflow lint.

Continuation2026-11-05:`check-package.mjs integration-deps` runs only backend
`npm ci` on the independent integration runner and writes
`ci-results/integration-deps/summary.json` (same field allowlist/seven-day upload).
HTTP paths must match known mounted `/api` endpoints; arbitrary path segments
and error strings are refused. New integration attempts remove old public
summary/http files before execution. Conflicting DOCKER_HOST/DOCKER_CONTEXT
overrides fail before Compose/provisioning. Hard runner termination remains an
explicit cleanup limit, not a guarantee of network persistence or shutdown.
