# Data and state —005

No schema, migration, API data field or persistent storage changes.

| Entity | Existing fields / local state | Rules |
| --- | --- | --- |
| Lesson context | course key from parent, lesson.id/title/sourceRevision | ID/revision key remounts inner panel; course parent key preserved |
| ChatMessage | id, question, answer, createdAt, userId, lessonId | server per-user latest50; no source revision/type/pages/citations |
| Transcript | returned messages + confirmed current-panel sends | unique ID, creation time/ID ascending, latest50; history failure retains it |
| Draft | text, local edit generation | trim3–1000; failure/reload/pending retain; unchanged generation clears on success; context/close/refresh resets |
| History operation | initial/reload pending, error, successful read | independent read guard/ref lock; cannot cancel send completion |
| Send operation | pending, submitted edit generation, error/success | immediate lock, separate guard; no automatic retry or cancellation guarantee |
| Summary | points[{text,page}], sourceType, sourceRevision, truncated | only returned fields; DOCUMENT/LESSON_CONTENT labels; pages optional |
| Summary operation | loading → success-points/empty/unavailable/error/changed-source | current guard only; retry pending gate; known revision mismatch withholds points |
| Reading position | near-bottom≤56px, anchor/top, new reply flag | preserve older position, jump/focus only explicit action |

Closing invalidates UI callbacks; it cannot undo a POST already processed. A later mount fetches authoritative private history. No localStorage, request queue persistence or unload-save promise is added.
