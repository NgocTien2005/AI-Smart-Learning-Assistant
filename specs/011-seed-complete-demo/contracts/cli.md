# Seed CLI contract

`npm run seed:demo -- --project <explicit> --api <loopback /api> --dry-run`

`npm run seed:demo -- --project <explicit> --api <loopback /api> --apply --private-console`

Development apply requires a real private TTY; dedicated launcher opens one. `--acceptance` is limited to verified isolated acceptance projects and handles fixture access only in memory. No implicit target, public domain, local8081, wildcard daemon or environment-only target accepted. Missing/unknown/mutually conflicting options exit nonzero before writes. Remote Docker context refused. There is no cleanup/reset/rotation command in this feature.

Optional public report path receives only a strict whitelist: target/project/database label, mode/outcome/counts/owned IDs/files, safe method/path/status and command/cwd/exit. Never print raw child output, credentials, hashes, full authenticated requests, connection strings or provider data. Errors are sanitized codes and preserve nonzero exit.

Container worker accepts bounded JSON stdin after host target proof and rechecks explicit dev marker/actual DB/local origin. Internal successful response may carry ephemeral access to the host process; it is not evidence output. Standalone invocation without proof/marker is refused. No public API contract changes.
