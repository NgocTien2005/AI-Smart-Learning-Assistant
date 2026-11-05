# Frontend state model
No Prisma/schema/migration changes.
| Entity | Rules | Transitions/lifetime |
| --- | --- | --- |
| Entry draft | name/email, Student/Instructor role, remember; exact password6–72 | Non-secret name/email survive modes only; secrets/visibility/errors clear at mode/session/departure. |
| Operation | location/mode, session generation, immediate gate | idle → validation/error or request → confirmed → verifying → verified/recovery; stale scope has no effects. |
| Verification continuation | accepted operation, return input, expected installed generation | GET-only retry; explicit logout restarts; external replacement invalidates. No password/token stored. |
| Forgot outcome | pending/generic/service/throttle/error/uncertain | No existence/delivery conclusion; manual retry only. |
| Reset context | mounted secret link, validity/completion/request scope | Separate lifetime per link/session; general400 stays usable; exact rejection requests new link. |
| Reset draft | exact password/confirmation, visibility | Mounted-only; success/departure clears; uncertainty keeps necessary input until explicit departure. |
Production User owns normalized email/name/role/active/authVersion/reset hash+expiry. Reset atomically revokes old sessions and clears reset fields; frontend does not replace server checks.
