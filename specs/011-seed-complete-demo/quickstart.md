# Validation guide

Read [demo data guide](../../docs/demo-data.md) once implemented. Use Node24+ and local Docker. First dry-run the explicit project/API. Apply first on a fresh isolated acceptance stack with dev-purpose marker; verify actual DB before any write, run twice and check original credentials/preexisting data remain intact. Check valid documents, quiz/grading states and both positive/negative HTTP authorization matrix.

Run backend test/quiz, installed Prisma validate/generate and migration status on the verified target; rebuild and health-check for schema changes. Existing HTTP integration remains a separate full-app test. Only after passes, refresh the local8080 backend without recreating DB and launch private console seeding. No secrets go to chat or evidence. Preserve private console to read initial access; rerun never reissues it. Browser role routes use dataset IDs; inspect relevant desktop1280×800/1440×900. No Google/SMTP/AI sends.

Do not delete dataset/upload/volume on completion. Report ownership registry and retained resources. Cleanup requires a new explicit request. Existing008 T026 policy-blocked profiles remain untouched.
