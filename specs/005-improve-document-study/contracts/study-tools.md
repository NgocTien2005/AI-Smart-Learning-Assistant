# Existing study tool contracts —005

Read-only inventory; no API/backend changes.

## Production and access

backend/server.js imports backend/src/app.js, which mounts courses router at /api/courses. courses.js uses authenticate (valid token, current active user/authVersion), then canAccessCourse checks instructor ownership or enrollment. Role guards and resource predicates are distinct. CourseRoute UI permits STUDENT/INSTRUCTOR; ADMIN has no added course bypass. backend/app.js legacy tests are not production proof.

## Operations

| Operation | Success | Validation/errors |
| --- | --- | --- |
| GET /api/courses/lessons/:lessonId/chat |200 {messages}; userId-scoped, latest50 descending query then reverse | invalid positive ID400; absent lesson404; not owner/enrolled403; auth401 |
| POST same /chat |201 {message}; persisted local lookup answer | trimmed string3–1000 else400;404/403 as above; no text422 {error}; no idempotency/version |
| GET /api/courses/lessons/:lessonId/summary |200 {title,points:[{text,page}],sourceType,sourceRevision,truncated} |400/404/403;422 {code:SOURCE_UNAVAILABLE,error,extractionStatus} |

API errors retain {error} plus current codes. services/apiErrors.js exposes status/code/message only, so exact extractionStatus cannot be used by these panels. Network failures remain recoverable through services/api.js;401 session handling remains unchanged.

ChatMessage has id/question/answer/userId/lessonId/createdAt, no citation/page/sourceRevision metadata. Successful local no-match is an answer string, not a new structured status. Do not infer provenance from current lesson metadata.

utils/lessonText.js chooses successful document text before manual content. Summary selects source sentences, may return no points, and supplies page references only when available. PDF text-layer extraction is local; no OCR or external AI.

## Verification boundary

Read/write/deny matrix: missing/invalid session; owner instructor; enrolled student/private history; non-owner instructor; non-enrolled/left student; ADMIN without resource access; other user's history; invalid ID/question and missing lesson/source. Only existing identified safe resources may receive sends; no account/resource provisioning or destructive cleanup. Integration script's register/create/SQL-delete behavior requires a healthy verified target and explicit authorization.
