# Implementation Plan: Complete demo dataset

**Feature**: 011-seed-complete-demo | **Date**: 2026-11-08 | **Spec**: [spec.md](spec.md)

## Summary

Replace unsafe small seed with an explicit-target orchestrator and create-only transactional dataset. Keep existing API/UI/schema relations and passwords intact; add one isolated ownership-registry table.

## Technical Context

**Language/Version**: Node24+ ESM, installed Prisma7.10/PostgreSQL17, React19 unchanged.
**Primary Dependencies**: Existing bcryptjs, crypto/fs/child_process, PDF.js; no npm dependency/lockfile changes.
**Storage**: Existing LMS tables/uploads plus DemoSeedDataset registry.
**Testing**: Node guard/content/registry regressions; actual isolated Docker seed twice + HTTP authorization; backend suite/quiz, Prisma checks, browser role read flows.
**Target Platform**: Local Linux Docker daemon, Windows operator CLI/private console.
**Project Type**: Existing two-package web app; seed CLI.
**Performance Goals**: Fewer than1000 rows, bounded60-second transaction, one dataset/version; no external provider traffic.
**Constraints**: No real user modifications, local8081/remote/public domain denied, credentials never in files/evidence, no automatic cleanup.
**Scale/Scope**: 18 users (1admin/4instructor/12active+1disabled student),8courses/48lessons,24assignments,26document files, varied relational states.

## Constitution Check

I: Preserve mounted API contracts/source resolution/quiz snapshots. II: Existing owner/enrollment checks stay authoritative; HTTP positive/negative matrix. III: Meaningful Vietnamese content and truthful prepared-chat labels; no UI redesign. IV: Tests distinguish fixtures/actual DB/private access/browser/hosted results. V: Create-only namespace, one additive registry table, explicit target verification and no user overwrites/reset/deletion. Pre/post-design PASS, no exceptions. Hooks absent.

## Project Structure

- backend/scripts/seed-demo.mjs: safe operator CLI; no config/Prisma import on host.
- backend/scripts/demo-seed/{target,dataset,seed,worker,verify}.mjs: Docker target proof, synthetic data, transaction, container worker, real HTTP verification.
- backend/scripts/demo-seed/documents/: original HTML sources + two real browser-printed PDFs with Vietnamese readable text layer. No runtime browser dependency.
- backend/prisma/schema.prisma/new migration: ownership registry only.
- backend/test/demoSeed.test.js: guard/content/ownership fixture tests.
- scripts/start-demo-seed.ps1: private interactive local console, no secret-file output.
- compose.dev.yaml and compose.acceptance.yaml: explicit LUMINA_DEMO_ALLOWED=true only for local demo/isolated acceptance.
- docs/demo-data.md, README and this feature's verification/traceability.

## Design and sequence

1. Host CLI requires --project and --api plus --dry-run or --apply. Verify local Docker endpoint, exact service identities, network/volume scope, healthy frontend binding, actual backend DB name/address; refuse8081 and remote/prod origin. Never infer DB from HTTP URL alone. Default dev target is known project8080; isolated target follows existing acceptance guards.
2. Worker runs only inside verified backend, receives bounded JSON stdin proof, rechecks actual DB identity, explicit LUMINA_DEMO_ALLOWED marker and localhost APP_ORIGIN. NODE_ENV=production alone describes container runtime optimization; it does not grant demo permission. Production Compose has no marker. No host backend/.env use.
3. DemoSeedDataset id=lumina-demo-v2, version2, manifest JSON (IDs, emails, join codes, file names/hashes, counts), createdAt. No credential/token fields. New table only, no existing-row backfill/FK/cascade changes.
4. Build18 users with *.demo.lumina.invalid emails and per-user random passwords,8unique versioned join codes,6lessons/course. Original lessons have goals/explanations/examples/practice and at least4definition candidates where quiz states are seeded. 3text/Markdown/CSV documents per course plus2PDFs; validate extraction before data writes, persist current document metadata/sourceRevision and real text separately.
5. Dry-run only reads registry/collisions and builds in-memory inventory; zero rows/files/password generation. On apply, reject any user-email/join-code collision without registry. Registry-present rerun validates immutable owner identity/record existence and reports unchanged; never repairs or rotates access. Refuse malformed/missing ownership.
6. Generate hashes before transaction; take PostgreSQL transaction advisory lock, recheck registry/collisions, use installed Prisma7 $transaction with timeout60000. Create rows + registry atomically. Write only fresh random-name files with wx in upload root; existing paths never overwritten. On failure report exact newly owned orphan names for separately authorized cleanup; no existing-file deletion.
7. Enroll students in subsets only; progress varied including0/partial/full, assignments future/past, absent/submitted/graded work with integer grades in range, quiz no-attempt/draft/submitted states with source snapshots/draft/selected answers/version. Prepared synthetic chat is labelled demo, not generated AI. No Google/reset/session data or external sends.
8. Worker returns access through an internal pipe in memory only. Development apply requires --private-console and actual TTY; show initial random access only there, never JSON report/log capture. Dedicated PowerShell window runs CLI and stays open for the user; no transcript. Isolated acceptance mode may handle generated fixture access in memory, never print/store it. Rerun keeps existing credentials; losing initial console does not authorize password reset.
9. Verify inside same initial process with generated credentials held in memory: login/me/role APIs, own/enrolled reads, unauthorized course/document/attempt/assignment denials and metadata states. Record only method/path/status/counts and IDs. Re-run seed and login original credentials to prove no resets; compare preexisting row digests before/after without retaining secrets.
10. Validate/generate/migration SQL/status, rebuild isolated stack, full backend/quiz and HTTP integration; run seed acceptance on its own new project and retain scoped cleanup report. After passes, refresh only existing dev backend image and seed default8080 via private console. Browser inspect role pages at required sizes using in-memory test fixture access where available; do not capture credentials.
11. Document exact dataset/private access/rerun/conflict/cleanup semantics and remaining external Google/AI gates. Analyze read-only and converge append-only without duplicating blockers; commit/push feature scope after checks.

## Complexity Tracking

No constitution exception. Registry is necessary to prove ownership across reruns/crashes; email prefixes alone cannot authorize adopting existing users. Prebuilt original PDFs avoid a new runtime PDF dependency or unreadable glyph fixtures.
