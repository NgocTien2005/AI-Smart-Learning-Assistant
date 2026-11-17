# Research (2026-11-17)

Decision: opt-in Compose override plus host Caddy; no cloud purchase, default stack edits or npm dependencies. Rationale: keeps same-origin/upload volumes and current APIs, gives operator concrete single-host path. Alternatives: static-only Vercel cannot alone host Express/Postgres/uploads; managed split services need separate storage/CORS/budget decisions.

Official references reviewed: https://docs.docker.com/reference/compose-file/merge/ (!override ports,2.24.4+); https://docs.docker.com/engine/network/port-publishing/ (loopback binding, pre28 caveat); https://docs.docker.com/compose/how-tos/production/ ; https://docs.docker.com/engine/install/ubuntu/ ; https://caddyserver.com/docs/automatic-https ; https://caddyserver.com/docs/caddyfile/directives/reverse_proxy ; https://caddyserver.com/docs/install . Primary-source research review requested per plan skill, findings consolidated before implementation.

No new data model. Domain/provider selection pending operator; example can be prepared without choosing real resources. Free billing state cannot be verified with API key alone. Do not use dev override in public deployment; no Google OAuth configuration remains.

Primary-source review result: !override2.24.4+ and Engine28+ caveat confirmed. Host Caddy topology requires correct A/AAAA and reachable80/443 plus persistent certificate storage. No access/debug/request-bearing logs in sample. Express keeps no trust-proxy: rate budgets see Nginx peer; explicit HTTPS APP_ORIGIN is required. Reviewer did not edit source or deploy.
