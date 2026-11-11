# Implementation Plan: Cohesive course modules

## Summary / Technical Context

Node24+/Express5/Prisma7, React19 hooks and current tests; no dependency/schema
change. Production src/app.js mounts courses router; authenticate remains at its
parent before child routers. UI → apiRequest → unchanged production endpoints.

## Constitution Check

I preserve contracts; II parent authentication + child roles/resource ownership;
III no layout change and preserve async/quiz/URL; IV actual suites/browser/DB;
V no private dev mutation. Pre/post-design PASS, no exceptions.

## Project Structure and decisions

- backend/src/routes/courses.js: course list/CRUD/join/roster/detail and composition.
- backend/src/routes/{assignments,lessons}.js: verbatim handler extraction, no mount
  prefixes changed. Child routers mounted after authentication and quiz router.
- backend/src/utils/courseAccess.js: existing parseId/canAccessCourse predicates.
- backend/src/services/{courseProgress,courseDocuments}.js: existing progress
  aggregate/file lifecycle/upload middleware helpers; explicit Prisma input for
  progress to keep tests narrow. Query shapes/public selects stay at consumer.
- frontend/src/hooks/useCourseRoster.js: exact existing effect/abort/active behavior.
- frontend/src/services/assignmentForm.js: existing pure form functions.
- frontend/src/components/assignments/StudentEditor.jsx: existing disclosure component.
- frontend/src/pages/CourseWorkspacePage.jsx and components/AssignmentsPanel.jsx
  import extracted responsibilities; no CSS/DOM redesign or session/quiz edits.

## Phases and risks

Inventory handler paths before moving, compare normalized handler blocks after.
Keep shared helpers minimal; no generic service framework. Existing production
integration covers authorization/upload/grading/quiz; request mount order and
cleanup must remain intact. Roster effect dependency list unchanged; full frontend
suite catches navigation/drafts/late responses. Legacy app remains on this branch
because test/auth.test.js still references it; retirement needs014 test port.

## Verification

Backend/full quiz, frontend test/lint/build, Prisma validate (no schema delta),
isolated LMS HTTP/DB and seeded Chrome role matrix. Fresh profiles only; scoped
cleanup retains volumes and never touches local8081/private dev configuration.

## Complexity Tracking

No new public contract/data model; no migrations. Extract, don't redesign.

## Current-base compatibility follow-up - 2026-11-11

T007 uses verified origin/portfolio/00-audit-speckit92e0585. Reapply original code commits86f96c9 andbd2bdf8, resolving only overlapping imports by retaining createJoinLimit and the extracted child-router helpers. Preserve current016 test organization,017 utilities and018 styles already in base. The old legacy-test reference decision is historical:014 tests now use the production router; keep the unmounted legacy file for this compatibility-only follow-up, documenting its actual references. No retirement or auth rewrite is included. Full package checks and fresh HTTP/database verify the reconstructed branch. Reuse earlier actual Chrome evidence only if all frontend source files exactly match the already browser-verified combined branch; otherwise run relevant browser cases. Add fresh sanitized command/cwd/exit, source comparison and current PR/base/hosted evidence under015/evidence.
