# Operations and recovery

This is a single-host local/demo foundation, not approval to deploy. See
[production readiness](production-readiness.md) for unverified public-release gates.
The actual runtime is `backend/server.js` → `backend/src/app.js`; the root
`backend/app.js` is a legacy harness. PostgreSQL and uploads are separate volumes.

## Diagnostics and privacy

The Nginx proxy records only numeric response status, body bytes and duration.
It deliberately omits URLs, paths, query strings, identities, headers, referrers
and bodies. Native Nginx error records can contain request URLs and cannot use
the access-log format, so HTTP-context error logging is suppressed. This loses
detailed proxy error diagnostics. Use sanitized status/error counts, latency,
health and backend safe event codes; reproduction should use synthetic data in
an isolated stack. Do not enable request-bearing debug logs against real
password recovery or authenticated traffic without a separately reviewed,
restricted incident procedure. Startup/configuration diagnostics can still
appear; they are not a reason to publish complete container logs.

Compose sets `json-file` rotation to `10m` × `3` per service. This is a log-size
policy, not a complete disk quota or redaction mechanism. It applies to newly
created containers; do not recreate an existing privately configured backend
just to apply it. Do not edit Docker's backing log files. Existing logs are not
sanitized retrospectively. Never publish raw DB/backend logs, `.env`, dump
archives, tokens, reset links or authenticated requests as CI evidence.

Proxy responses add nosniff, no-referrer, SAMEORIGIN and disabled camera,
microphone/geolocation permissions. They retain API routing/body limits and
same-origin blob-document preview. Real GIS acceptance remains feature010's
separate gate. CSP, COOP and HTTPS/HSTS require deployment-specific review;
they are not silently enabled on the HTTP development server.

## Synthetic recovery drill

From repository root with Node24+ and a local Linux Docker engine:

```powershell
node --test scripts/ci/test/*.test.mjs
node scripts/ci/integration.mjs
```

The integration runner creates a fresh project, network, volumes, loopback port
and secrets. It verifies both HTTP ownership and the database actually used by
the backend, runs the production HTTP/database suite, then revalidates identity
before operations checks. The drill creates one synthetic table row and upload
fixture, dumps the empty LMS schema plus fixture, restores into a newly created
`lumina_restore_<random>` database, compares fixture/migration/user counts and
upload digests. It also verifies Nginx configuration, headers, privacy canaries
and actual log rotation settings. Errors fail the job; cleanup does not hide them.

Only this invocation's containers/network are removed, without `-v`. Two named
volumes, the synthetic source/restored fixture and upload are retained and
reported in `ci-results/integration/summary.json`. Temporary archives inside
container writable layers disappear with those containers. No archive is
uploaded. This proves the narrow synthetic recovery mechanism, not a recovery
objective or a complete backup of live application data. No local8081 resource
or historical policy-blocked browser profile is touched.

## Real backup/restore procedure requiring an operator plan

1. Agree on ownership, RPO/RTO, retention, encryption, off-host storage and
   access/rotation policy. Verify exact Compose/container/database/volume
   identities and environment classification. Stop if ambiguous.
2. Quiesce application writes using an approved maintenance procedure so the
   database snapshot and uploads describe the same logical moment. `pg_dump`
   provides a consistent database snapshot; it does not include uploads,
   cluster roles or their lifecycle. Record application revision and migration
   status, plus a file manifest and digests in restricted backup metadata.
3. Run `pg_dump --format=custom --no-owner --no-acl --file <private path>`
   **inside the verified DB container**, using its configured database/user.
   Copy the binary file out with `docker cp`; PowerShell5.1 `>` or a text pipe
   can corrupt binary dumps. Archive verified uploads separately. Do not print
   connection strings or copy archive contents to logs/artifacts.
4. Restore only into a newly provisioned, explicitly verified empty target.
   Use `createdb --template=template0` and
   `pg_restore --exit-on-error --no-owner --no-acl`. Do not use `--clean`, reset,
   drop, existing production targets or untrusted archives. Restoring an archive
   can execute SQL, so accept only controlled backups from the verified source.
5. Validate migration history, row/file consistency, authorization and actual
   protected download/login/workflow smoke tests on that isolated target.
   Record duration against agreed recovery objectives. Keep the source untouched
   until the operator approves a separate release/recovery decision.

## Release and rollback checklist

- Select domain/TLS termination, renewals, firewall and binding. Verify
  APP_ORIGIN/CORS/reset-link/GIS origins through the actual HTTPS proxy.
- Provision strong secrets privately; disable demo markers/accounts and cloud
  demo in a public environment. Review DB least privilege and container/upload
  ownership before changing users. Existing root-owned volume compatibility
  has not been migrated automatically.
- Review dependency/image advisories on the chosen revision. No lockfile/image
  upgrade or vulnerability scan is implied by this work.
- Require exact-revision frontend/backend/integration CI and human review.
  Back up DB and uploads consistently. Review immutable migration SQL/status;
  never rewrite migration history to roll back an application.
- Stage the release and test all roles, protected resources, uploads, session
  revocation and optional providers actually enabled. `/api/health` is liveness,
  not proof of DB/storage readiness. Assign monitoring, alert thresholds,
  capacity checks and incident ownership; no monitoring service is fabricated.
- Roll back application images only if compatible with current data/migrations.
  Otherwise stop writes and follow an approved forward-fix or tested recovery
  plan. Do not automatically revert database schema or delete volumes.

Required public topology, multi-process rate limits, recovery objectives,
monitoring and real provider acceptance remain open. This guide does not grant
deployment or destructive-operation permission.

## Official references reviewed 2026-11-10

- [Nginx access logging](https://nginx.org/en/docs/http/ngx_http_log_module.html)
  and [native error logging](https://nginx.org/en/docs/ngx_core_module.html#error_log).
- [Nginx response headers](https://nginx.org/en/docs/http/ngx_http_headers_module.html).
- [Docker JSON log rotation](https://docs.docker.com/engine/logging/drivers/json-file/).
- [PostgreSQL17 dump](https://www.postgresql.org/docs/17/app-pgdump.html) and
  [restore](https://www.postgresql.org/docs/17/app-pgrestore.html).
