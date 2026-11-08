# Traceability — complete demo dataset
| Requirement | Stories/tasks | Evidence/result |
| --- | --- | --- |
| FR001/002 explicit target/preview | US1 T004/005/007/011/014/015 | guard regression + fresh target actual DB/port/network/mount proof; preview0writes; dev explicit preview PASS |
| FR003/004 ownership/create-only/rerun | US1 T003/006/011 | additive migration/status; collision denied, transaction rows, manifest/files validation; rerun no duplicates and initial/sentinel password preserved PASS |
| FR005/006 useful inventory/documents | US2 T008/009/014/015 |18accounts/8courses/48distinct >=600char lessons;4quiz candidates each,26documents all HTTP/extraction;2PDFs rendered/extracted PASS |
| FR007 lifecycle/data | US2 T008/010/011 | observed submitted/draft/unstarted quiz, graded/pending/absent assignments and varied progress PASS |
| FR008 authorization | US2 T010/011/015 | all-role login/me, disabled401, cross-owner roster/course, unenrolled course/document, other-owner attempt denial; real role browser PASS |
| FR009 credentials | US3 T004/007/012 | nonTTY apply denied; private local console initial only; no shared/hardcoded password or credential file; rerun no reset PASS |
| FR010 external sends | US3 T008/012/013 | synthetic .invalid, no seed email/Google/AI requests; old008/010 gates retained PASS |
| FR011 evidence/cleanup | T001/002/013–016 | allowlisted public JSON/commands, scoped row/container cleanup and retained volumes, no local8081/profile deletion; hosted result tracked separately |
| SC001–004 | T014–016 | local backend/schema/HTTP+DB and actual dev seed; real desktop1280x800/1440x900; actual hosted run pending Git step |
