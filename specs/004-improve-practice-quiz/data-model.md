# Existing data and UI state

No schema/query/migration changes.

- QuizAttempt: id/userId/lessonId, immutable questions JSON, draftAnswers JSON, optional selectedAnswers, integer version, optional score/submittedAt, createdAt. Existing user/lesson cascade foreign keys and index[userId,lessonId,createdAt] unchanged. Migration20261009150000_persist_quiz_attempt_lifecycle immutable.
- History: id/score/createdAt/submittedAt/version/questionCount; no requested/actual counts.
- Draft: attemptId/version/submittedAt:null/answers/public questions. Null means unanswered; option0 valid.
- Result: attemptId/score/total/submittedAt/legacyAnswersUnavailable/questions with selectedIndex/correctIndex/isCorrect/explanation/sourcePassage. Score0 valid; legacy null choices are not newly wrong answers.
- UI session: identity, latest choices, confirmed snapshot, version, pending counter/serialized tail, failed/conflicted block. Read intent separate from session identity. Lesson remount invalidates old responses.
- Creation: local open/count integer3..10; retains count/error on collapse/failure, closes on success. No new localStorage/server persistence.
- Selection/filter/open errors local; only section/lesson/panel URL-backed.

Transitions: no selection to opening to draft/result; open failure retains old detail. Draft saved/unsaved/saving/failed/conflicted, explicit retry/rebase/load-saved-confirm. Submit complete/latest-confirmed to result, errors retain choices. Leave flush or confirmed discard, unload only warns.
