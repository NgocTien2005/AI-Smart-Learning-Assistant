# Implementation Plan: Retire Google authentication

## Technical context and trace

React19 AuthPage -> SessionContext/api -> production src/app.js -> auth router -> Prisma. AccountPage currently mounts GoogleLinkPanel -> SDK -> googleAuth router -> subject column. Remove this side branch; ordinary profile/password routes stay mounted. No dependency/API changes beyond intentional OAuth404 retirement; no migration.

## Constitution check

I contract: explicit OAuth removal with consumer/test/docs updates. II authorization: email auth and owner/enrollment untouched. III UI: preserve two-column identity, remove controls only. IV evidence: full package gates, isolated integration, three-role auth/account desktop. V data/privacy: preserve users, immutable migrations, secrets and local8081; no SMTP/provider tests in CI. PASS before implementation; recheck after verification.

## Research and decisions

No unresolved technology choice or external dependency: remove existing modules, keep platform404 handler. Dormant googleSubject preserved for compatibility; no writes/read authorization. Existing records have passwords because Google never created accounts. Gemini/Gmail remain independent. See research.md and contracts/retirement.md.

## Phases

1. Specification/clarification, requirements checklist review, tasks and read-only analyze.
2. US1: add absence regression, remove AuthPage/AccountPage controls and orphan frontend modules/tests; preserve session/password tests.
3. US2: production404 regression, unmount/remove backend provider modules/config; replace isolated OAuth tests with removed-endpoint assertions, retain auth/data redaction. Remove build/compose OAuth arguments and update active docs.
4. Full frontend tests/lint/build; backend/quiz; CI helper tests and fresh isolated integration; browser1280x800/1440x900 three-role login/account. Build frontend image and sync verified runtime without removing private Gemini env. Evidence, read-only reanalysis, append-only converge, coherent commits.

## Git and risks

Branch refactor/remove-google-auth is temporarily stacked on021 f22d6d8 because runtime/model repair is unmerged. Intended PR base feat/gemini-lesson-chat. Never merge main, force-push or deploy. Previous remote auth canceled: local commits only until remote access legitimately restored, no credential bypass. Risks: stale clients404, accidental SMTP/Gemini removal, lost password gating; targeted absence and preserved auth/role tests address these. No database cleanup or volume deletion.
