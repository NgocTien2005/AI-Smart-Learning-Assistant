# Research ? 2026-11-10

Decision: allowlist access status/duration/bytes and suppress native request errors; error severity alone cannot guarantee privacy. Alternative query-only redaction leaves path/referrer/error leaks. See https://nginx.org/en/docs/http/ngx_http_log_module.html and https://nginx.org/en/docs/ngx_core_module.html#error_log . Research agent independently confirmed these risks.

Decision: add_header always, no add_header_inherit (not available in Nginx1.27), no CSP/COOP/HSTS without separate GIS/blob/TLS validation. https://nginx.org/en/docs/http/ngx_http_headers_module.html . Real Google remains unverified.

Decision: per-container json-file rotation, no daemon changes or development container recreation. https://docs.docker.com/engine/logging/drivers/json-file/ . Limits apply to new containers; rotation is not redaction.

Decision: integrate operations-check.mjs into the existing fresh integration lifecycle after its 90 HTTP operations, avoiding another environment launcher. Revalidate actual target immediately before provisioning a synthetic fixture. pg_dump custom binary file inside container; restore into a newly created empty DB with pg_restore --exit-on-error --no-owner --no-acl. Retain DB/volumes, no --clean/reset/drop. https://www.postgresql.org/docs/17/app-pgdump.html and https://www.postgresql.org/docs/17/app-pgrestore.html . Dump does not include uploads or global roles. Only same-invocation synthetic archives are accepted.
