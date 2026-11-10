# Feature Specification: Safe local operation foundations

**Feature**: 019-deployment-operation-foundations | **Created**: 2026-11-10
**Status**: Specified | **Git branch**: chore/deployment-foundations

## Problem, goals and non-goals

Operators need bounded diagnostics without retaining reset URLs, and a reproducible recovery rehearsal. Current Nginx inherits request-bearing access/error logs; volumes alone do not prove recoverability. Goals are safe proxy defaults, log rotation, synthetic recovery and an honest release runbook. Excluded: deployment, production backups, authentication changes, dependencies, schema/migrations, deleting volumes or modifying existing databases/users.

## User Scenarios & Testing

### US1 - Private diagnostics (P1)
As an operator I can inspect response outcomes without collecting URLs or identity.
Acceptance: successful and failing frontend/API responses have declared headers; synthetic secret markers in path/query/header/body/referrer do not appear in proxy output. Preserve API proxying and document downloads.

### US2 - Safe recovery rehearsal (P1)
As a maintainer I can restore synthetic fixtures in a fresh owned acceptance stack.
Acceptance: verify HTTP and actual backend database before provisioning; dump and restore into a new database, compare fixture content and upload digests. Missing/mismatched targets fail before mutations. Failures are nonzero. Only own containers/network are removed; volumes/restore fixture remain reported.

### US3 - Honest release guidance (P2)
As an operator I can distinguish local evidence from public-release conditions.
Acceptance: guide covers TLS/origins/proxy, least privilege, secrets, consistent DB/uploads backup, monitoring, migrations, rollback and optional-provider limitations.

## Requirements

- **FR-001**: Proxy diagnostic output excludes URLs, query strings, identifiers, referrers, user agents, bodies and authentication material, including error paths.
- **FR-002**: Responses restrict content sniffing, referrers, framing and unused devices; container logs use finite rotation. Preserve routes, upload limits and Google/document compatibility.
- **FR-003**: Recovery verifies target identity, compares restored synthetic DB/file contents and propagates errors. Never reset/drop existing databases, delete volumes or access local8081.
- **FR-004**: Document demonstrated local behavior separately from open production and real-provider gates.

### Non-functional, security and compatibility
No runtime dependency, schema, migration or API change. No private backup or provider request. No raw archive/request log published. Do not recreate the privately configured development backend. Operational summaries contain command/cwd/exit, identities, counts and comparison booleans only.

### Edge cases
Unknown routes, upstream errors and invalid methods cannot introduce request-bearing logs. Restore destination must be newly created; missing/mismatched targets and restore failures must stop. Never accept an archive from outside the current synthetic invocation.

## Clarification review - 2026-11-10
No critical ambiguity requires questioning: deployment/destructive operations are excluded. Recovery creates a new DB inside an invocation-owned stack and retains it. Suppress native request-bearing Nginx errors, retaining sanitized access statuses/duration; emergency diagnostics need a separate controlled procedure. Production RPO/RTO/retention/topology remain operator decisions.

## Success Criteria
- **SC-001**: Every declared proxy probe returns expected headers and zero synthetic marker occurrences in diagnostic output.
- **SC-002**: One fresh recovery rehearsal restores equivalent synthetic database/file content without modifying existing environments; all required checks succeed and resource retention is recorded.
- **SC-003**: Reviewers can identify every remaining public-release condition from the runbook and evidence.

## Assumptions and entities
Single-host Compose remains local topology. Operation records are sanitized. Recovery archives are ephemeral sensitive material, never CI artifacts. Existing users and historical provider/cleanup evidence are unchanged.
