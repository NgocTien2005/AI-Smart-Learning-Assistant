# Feature Specification: Automated Lumina quality checks

**Feature directory**:009-setup-quality-ci, allocated by the installed official script; independent of Git branch.
**Created**:2026-11-03
**Status**:Specified
**Input**:Automate frontend/backend/isolated integration verification; preserve email/password authentication and track feature008 SMTP acceptance separately.

## User Scenarios & Testing

### User Story 1 — Receive reliable change checks (Priority:P1)
A maintainer receives separate frontend, backend and integration results for a proposed or pushed change, and can request the same checks manually.
**Why this priority**:A passing build alone cannot establish that Lumina's existing behavior still works.
**Independent Test**:Inspect all three entry events and run the required package commands; introduce a controlled check failure and verify it remains a failure.
**Acceptance Scenarios**:
1. **US1-AC1**:A pull request, push or manual request starts the same three required check groups for the submitted revision.
2. **US1-AC2**:Frontend dependency installation, full tests, lint and build each produce a visible success/failure outcome; no failed command is treated as success.
3. **US1-AC3**:Backend dependency installation, full regression and the named production quiz regression are checked separately; legacy auth tests are not presented as production HTTP proof.
4. **US1-AC4**:The three groups do not depend on one another's success, and a failed group does not conceal the other groups' outcomes.
5. **US1-AC5**:Existing lockfiles/dependencies and the repository-supported runtime are used without upgrading the application or modifying its business behavior.

### User Story 2 — Verify integration without touching local data (Priority:P1)
A maintainer can exercise production HTTP/database behavior in a disposable, isolated test run without risking an existing Lumina stack.
**Why this priority**:The integration suite creates and removes accounts/resources; choosing HTTP alone is unsafe.
**Independent Test**:Run the real suite on a new isolated target and reject missing, reused, mismatched or unhealthy targets before business-data writes.
**Acceptance Scenarios**:
1. **US2-AC1**:Each run and rerun has its own project, network and storage; parallel runs cannot share a project/database volume. The frontend binds only a verified unused loopback port.
2. **US2-AC2**:Before provisioning, the runner waits for health and verifies labels, HTTP binding, network/mount isolation and the database/address actually used by the backend.
3. **US2-AC3**:Missing/unsafe target, existing project resources, unhealthy services or mismatched HTTP/database causes failure before test account provisioning; raw environment/secret values are not exposed for diagnosis.
4. **US2-AC4**:The production integration suite reports its resource IDs, authorization checks and remaining-owned-account count. Cleanup attempts only the run's recorded resources and cannot turn a failed check into a pass.
5. **US2-AC5**:Test secrets exist only for the run; no production/Gmail credentials or local secret file is required. Existing local/acceptance data and old volumes remain unchanged.

### User Story 3 — Review honest evidence and outstanding acceptance (Priority:P2)
A reviewer can distinguish workflow validation, local command execution, isolated integration, hosted CI and actual email delivery.
**Why this priority**:These evidence types establish different claims; feature008 still has external acceptance gaps.
**Independent Test**:Review sanitized outcomes and traceability, then follow the documented local/hosted steps without supplying production credentials.
**Acceptance Scenarios**:
1. **US3-AC1**:Every attempted check records command, working directory, exit outcome and revision/environment context; failed jobs retain only explicitly allowed non-sensitive evidence for a bounded period.
2. **US3-AC2**:No artifact includes credentials, environment files, reset URLs/tokens, browser profiles or raw authenticated requests/responses. Missing evidence is labelled as missing.
3. **US3-AC3**:Documentation explains local reproduction, first hosted execution and limitations. Hosted success is claimed only with an actual run for the reviewed revision.
4. **US3-AC4**:Tasks/artifacts001–008 remain owned by their original feature. Feature008 T023 delivery/reset and T026 cleanup stay open unless their complete evidence exists; missing SMTP does not prevent independent CI work or trigger real mail in routine checks.

### Edge Cases
- Concurrent/retried runs, occupied port, stale project volumes/network without containers, interrupted startup and failed cleanup.
- Dependency installation failure, failed full suite with an isolated passing test, failed build, unavailable Docker and missing sanitized integration evidence.
- Frontend healthy but backend connected to a different database; same database name on another server; inappropriate labels or shared storage.
- Failed integration after resources were created; cleanup failure must preserve both failures and must not target another run.
- PRs without secret access; no network/SMTP credentials available; hosted execution unavailable before an authorized push.
- No source/UI change is needed; old auth screenshots do not prove new CI runs or actual email receipt.

## Requirements
### Functional Requirements
- **FR-001**:Provide automatic proposed-change/push checks and a manual entry point for the same required groups. (US1-AC1)
- **FR-002**:Check frontend clean dependency installation, full tests, lint and build with independent recorded outcomes. (US1-AC2)
- **FR-003**:Check backend clean dependency installation, full regression and production quiz regression; distinguish legacy tests. (US1-AC3)
- **FR-004**:Use existing lockfiles and supported runtime without application dependency/policy changes. (US1-AC5)
- **FR-005**:Keep groups independent, bounded in duration, and propagate every required-check failure. (US1-AC4;US2-AC4)
- **FR-006**:Verify healthy isolated HTTP and actual backend/database target before integration provisioning. (US2-AC2)
- **FR-007**:Reject absent, unsafe, reused, unhealthy or mismatched test targets before data writes. (US2-AC3)
- **FR-008**:Allocate unique per-run/rerun project/network/storage and an unused loopback HTTP port. (US2-AC1)
- **FR-009**:Clean only resources owned by the run; retain/report cleanup failures and never remove old volumes. (US2-AC4/5)
- **FR-010**:Generate test-only secrets at runtime; do not load local secret files or require production/SMTP credentials. (US2-AC5)
- **FR-011**:Record command/cwd/exit/revision/environment with sanitized evidence that excludes sensitive request or configuration values. (US3-AC1/2)
- **FR-012**:Retain an explicit evidence allowlist on failure and success for a documented bounded duration. (US3-AC1/2)
- **FR-013**:Document local reproduction and first hosted run; do not claim hosted success from YAML/local validation. (US3-AC3)
- **FR-014**:Preserve existing email/password authentication, roles, identity verification, reset semantics and the current two-column auth UI; no new authentication method or mail provider. (US1-AC5;US3-AC4)
- **FR-015**:Keep previous feature tasks/evidence separate, including008 SMTP receipt/email-origin reset and policy-blocked profile cleanup. Routine CI must not send real mail. (US3-AC4)
- **FR-016**:Validate workflow structure and meaningful runner safety/failure cases; never hide a full-suite failure with a narrower pass. (US1-AC2/3;US2-AC3/4)
- **FR-017**:Preserve the captured working-tree baseline and all unrelated application/specification work; no commit/push/deploy in this task. (US1-AC5;US3-AC4)

### Key Entities
- Verification run:revision, event/run identity, check groups and final outcomes.
- Isolated target:project, containers, HTTP port, actual database and owned resources; uniqueness checked before creation.
- Evidence record:command, cwd, duration/exit outcome, public target/resource identifiers and typed verification limits; never credentials or request bodies.
- External acceptance record:reference to previous feature task and its evidence/blocker, not a transferred CI task.

## Success Criteria
- **SC-001**:All three entry events select the same three required groups; no required group is skipped through path filters or dependency failures.
- **SC-002**:All required installation/test/lint/build/regression/integration commands have explicit success/failure evidence; no failed full suite is reported as passing.
- **SC-003**:Every unsafe-target safety case is rejected with zero integration provisioning writes; the live run verifies the actual backend database before its first business mutation.
- **SC-004**:A successful live integration run leaves zero owned test accounts; existing stack identities/storage are unchanged and no old volume is removed.
- **SC-005**:All uploaded evidence belongs to the declared allowlist and includes command/revision/environment context; zero credentials, reset links or raw authenticated exchanges are retained.
- **SC-006**:Every injected required-check or cleanup failure yields a nonzero final result; both outcomes remain visible when failures coincide.
- **SC-007**:All17FR,14acceptance scenarios and8success criteria map to tasks and typed evidence with precise missing conditions.
- **SC-008**:The first actual hosted execution for the delivered revision records all three group outcomes before hosted success is claimed; until authorized execution, that acceptance remains explicitly open.

## Assumptions
- Use the repository's existing package commands and production integration suite. Maintain application contracts, schemas, migrations, dependencies and auth presentation.
- Baseline001–007:175/175closed;008:24/26 with T023/T026 open, subject to current evidence recount. Previous tasks are not moved here.
- Existing Gmail transport requires user-configured test credentials outside chat and an explicitly permitted mailbox/send scope. Actual delivery is separate from routine automation.
- Workflow publication/hosted execution is unavailable without a later authorized push; local validation continues independently and cannot close hosted acceptance.
- The new run may create its own isolated test stack/accounts and clean its own resources. Old database volumes and policy-blocked profiles are not deletion targets.
