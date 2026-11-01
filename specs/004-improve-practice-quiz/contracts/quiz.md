# Unchanged quiz contract

Trace: App/Session(/api/auth/me) -> CourseWorkspacePage -> PracticeQuizPanel -> services/api.js -> backend/server.js/src/app.js(/api/courses) -> routes/courses.js authenticate -> quizAttempts.js -> Prisma lesson/course/enrollment/QuizAttempt. backend/app.js is legacy.

| Operation | Boundary/response/errors |
| --- | --- |
| GET /api/courses/lessons/:lessonId/quizzes | Positive ID; current course owner/enrollment; current user's attempts newest createdAt/id first, derived questionCount.400/403/404. |
| POST same | count integer3..10(default5);201 attemptId/version/requestedCount/actualCount/message/public questions.400 invalid,422 unsuitable source,403/404. No keys/source/explanation. |
| GET /api/courses/quiz-attempts/:attemptId | Owner else404; current lesson access else403. Draft answers/public questions/version; submitted durable result plus version. |
| PUT .../:attemptId/draft | Exact-length answers null or valid option index, integer version. Conditional owner/submittedAt:null/version updateMany.200 version/answers;400 invalid;409 ATTEMPT_SUBMITTED/ATTEMPT_VERSION_CONFLICT. |
| POST .../:attemptId/submit | Complete valid answers/integer version, same conditional update.200 durable result (version not promised),400 incomplete,409 submitted/version. |

Missing/invalid/revoked authentication401 {error,code}; preserve existing error shape/codes, no password/hash/token logging.
Production requireStudent defaults no-op and is not injected; actual predicate instructorId===user.id OR enrollment and attempt.userId===user.id. UI CourseRoute only STUDENT/INSTRUCTOR. Do not claim unconditional ADMIN role403 independent of relationships; no bypass/new privilege.

Panel props lesson/onClose/onRegisterBeforeLeave unchanged. Wrapper keyed lesson.id. History child emits select/read-retry only. Creation child emits count submission; opening never writes. Reuse shared ConfirmDialog/Button/Feedback.

Runtime matrix: enrolled student/course-owning instructor own attempts allowed; missing/invalid401; another user's attempt404; own attempt after course leave403; invalid IDs/payload400/404; stale/submitted409; ADMIN without relationship denied by actual predicate. Designated existing safe resources only for writes. No registration/provision/reset/cleanup.
