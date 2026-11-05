# Verification guide

1. Preserve baseline and resolve009 using installed official scripts. Read AGENTS.md and the workflow/artifact gates. Do not read local secret files.
2. With supported Node and existing lockfiles, run from repository root:
   - node scripts/ci/check-package.mjs frontend
   - node scripts/ci/check-package.mjs backend
   - node scripts/ci/check-package.mjs integration-deps (backend install for an independent integration runner)
   Helpers include npm ci and existing checks; summaries are under ignored ci-results/.
3. Review backend/scripts/integration-check.mjs and integration-target.mjs. With local Linux Docker healthy, run node scripts/ci/integration.mjs. It refuses existing project resources and selects a fresh loopback target, creates only test data and validates actual backend DB before provisioning.
4. Inspect ci-results/integration/{summary,http}.json and remainingOwnedUsers0. Cleanup is scoped; named volumes are intentionally retained locally. Never reset/drop or remove local8081/old acceptance volumes. A retained project name cannot be reused with new secrets.
5. Validate .github/workflows/ci.yml with official actionlint1.7.12; test guard/failure cases using node --test scripts/ci/test/ci.test.mjs. Source-filtered Linux Node24 verification is distinct from host commands.
6. After a separately authorized push, inspect GitHub Actions for the exact delivered revision and all three required job results; retrieve only the allowed summaries. workflow_dispatch becomes available when the workflow exists on the default branch. Without that run, keep hosted acceptance task open.
7. For008 SMTP, review the ignored prepared launcher and its secret handling. The user supplies test Gmail config and an explicitly permitted recipient/send limit outside chat. Do not send until those conditions and target isolation are verified. Mailbox receipt/reset from email are distinct from DB-prepared link tests; no routine CI email.
8. Update verification/traceability with actual command/cwd/exit and evidence type, then analyze read-only/converge append-only. Do not close008 T023/T026 or hosted acceptance from local green checks.
