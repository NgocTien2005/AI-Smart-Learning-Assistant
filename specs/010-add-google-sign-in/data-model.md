# Data model

`User.googleSubject String? @unique`: stable Google `sub`, nonempty up to 255 characters, null for all existing rows. One identity per account, unique across accounts. Only authenticated deliberate linking can change null to a value; same-value linking is idempotent. No replacement/unlink in scope. Password, email, role, active/authVersion, foreign keys/cascades unchanged. No backfill or user creation.

New SQL must only add the nullable column and unique index. Generate the schema-to-schema migration diff using the installed Prisma version; historical LessonProgress index divergence is unrelated and must not enter this migration. Review before deploy, generate client and inspect status on the isolated target. Recovery is to disable optional Google configuration; do not drop columns or reset data automatically.

In-memory challenge: random opaque ID, nonce, hashed cookie binding, intent, expiry; optional userId/authVersion. Maximum 1000, lifetime 300 seconds; 20 issuances/IP/300 seconds, bounded limiter map. Consume once before verification; exact browser binding required. Never persist credentials, challenges, or provider tokens in evidence.
