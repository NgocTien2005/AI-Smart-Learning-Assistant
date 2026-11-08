# Data model

Add only `DemoSeedDataset`: `id String @id`, `version Int`, `manifest Json`, `createdAt DateTime @default(now())`. Registry has no API exposure or credentials. Existing tables/relations remain unchanged. New immutable migration creates this table; existing rows require no backfill. Manifest IDs are ownership evidence, not cascaded foreign keys: missing/changed owned rows cause a conflict, never automatic repair/deletion. Disabling seed has no data impact; rollback must not drop data automatically.

Manifest: versioned user IDs+synthetic emails+roles; course IDs+join codes+owner IDs; lesson/assignment/submission/quiz/chat IDs and parent IDs; enrollment/progress composite IDs; uploaded filenames/hash; expected counts. Validate shape and namespace before trusting it. No password/hash/session/reset/provider token inside manifest/report.

Quiz states follow production JSON snapshots with `draftAnswers`, `selectedAnswers`, integer version and computed grade. Document metadata follows `processDocument`/`resolveLessonSource` contract: text/hash/status/truncated/revision distinct from manual content. All new rows are created transactionally with the registry.
