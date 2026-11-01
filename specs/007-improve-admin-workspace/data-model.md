# Client state —007
No database/schema/migration changes.

| State | Lifetime / transitions |
| --- | --- |
| Session scope | context user.id + credential generation; mounted/current-generation guards; no shared006 changes |
| Results | confirmed users/query/page/total/totalPages; pending query separate; stale label on loading/error |
| Search/page | local trim120 query,250ms debounce, server clamp; refresh/default route resets |
| Selection | null→explicit ID→switch/close; authoritative omission clears, no auto replacement |
| Drafts | perID name/role +dirty; close/filter/page/error retains; route/session boundary clears |
| Locks | perID immediate ref plus rendered pending; independent targets may overlap |
| Outcomes | perID target-specific success/validation/conflict/uncertain; separate list error |
| Confirmation | captured target/public identity/payload; canceled on view/selection/denial; confirm rechecks scope/lock |
| Access denial | current403 blocks actions/read effects, closes confirmation; explicit /me recovery or current401 expiry |
