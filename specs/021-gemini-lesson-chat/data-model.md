# Ephemeral data model

No Prisma change/migration. Existing user.active/authVersion, course.instructorId/enrollments and lesson sourceRevision/documentText/content remain authoritative.

- Selected source: lessonId, title, sourceType DOCUMENT/LESSON_CONTENT, sourceRevision, SHA256 fingerprint of full selected text/title, excerpt≤12k chars; chunks S1..Sn≤1200chars. Source text resolved only server-side; no client source text or URLs.
- Request: question(nonempty≤2000), history(array≤6 alternating user/assistant messages, starts user and ends assistant; each≤6000, user≤2000), sourceType, sourceRevision(nonnegative safe integer), consent(exact true).
- Reply: provider/model, answer/insufficient/citations/questions(empty), lessonId/sourceRevision/sourceType. Citations exact source substrings≥20≤800chars.
- UI: unselected → selected+acknowledged → pending → answered/error/cancelled. Change lesson/revision/session or close clears all ephemeral turns/consent. Successful pairs only retained, latest3pairs sent; no localStorage/database conversation writes.
