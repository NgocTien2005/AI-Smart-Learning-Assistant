# Course implementation boundaries

`backend/server.js` starts `src/app.js`. Its `/api/courses` router authenticates
before composing quiz, assignment and lesson routers; child route paths keep
the same `/api/courses` prefix. Role and owner/enrollment checks remain in each
handler. ADMIN is not a course-content bypass.

| Module | Responsibility |
| --- | --- |
| routes/courses.js | Course list/CRUD, join/leave, roster, course detail and composition |
| routes/assignments.js | Assignment management, submission and grading |
| routes/lessons.js | Lesson CRUD, progress, protected documents, summary and local chat |
| routes/quizAttempts.js | Immutable snapshot/draft/version/submit lifecycle |
| utils/courseAccess.js | Existing positive integer parser and owner/enrollment predicate |
| services/courseProgress.js | Aggregate progress; Prisma is an explicit argument |
| services/courseDocuments.js | Upload limits, storage processing and owned file cleanup |

The extraction changes module placement, not public contracts. Handlers retain
validation/query/response shapes, transactions, optimistic concurrency and upload
cleanup. Avoid generic CRUD abstractions that hide authorization differences.
Lesson selectors are shared from the lesson module; relation queries remain
visible where responses are assembled.

Frontend `useCourseRoster` owns roster fetch/abort/active lifecycle; the workspace
still owns section/query navigation and quiz flush. Assignment form transformations
are pure functions in `services/assignmentForm.js`; StudentEditor is an isolated
presentation/disclosure component. Assignment mutation locks, retained drafts and
versioned quiz behavior remain with their existing owners.

Independent architecture branch keeps the legacy `backend/app.js` because its
baseline auth test still references it. Separate security feature014 ports those
assertions to production router/current-user factories. Retire legacy only after
integrating that prerequisite and confirming no executable references remain.
Do not infer production coverage from legacy tests on older revisions.

See [feature015 verification](../specs/015-architecture-module-boundaries/verification.md)
for method/path equality, frontend/backend checks, real HTTP/database matrix and
Chrome desktop observations. This is a module guide, not a new service framework.

## Verified-base follow-up - 2026-11-11

The replacement architecture branch starts from already-merged base92e0585 and preserves current production auth tests, join-code rate limiting, AI utilities and responsive styles. Only original architecture code commits were reapplied; the courses import overlap retains createJoinLimit alongside the extracted routers/helpers. The legacy root app remains unmounted and no longer imported by current auth tests. Its removal is not part of this compatibility-only follow-up. Feature015 T007 records current-base/local/hosted evidence; original PR7/branch remain intact for historical comparison.
