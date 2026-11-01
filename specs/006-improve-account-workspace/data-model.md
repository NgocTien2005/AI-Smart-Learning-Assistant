# Client state —006

No database/data-field/migration changes. Existing User public fields id/name/email/role; name alone editable.

| State | Fields/lifecycle | Rules |
| --- | --- | --- |
|Credential scope | module generation + request token snapshot | generation advances on clear/install, including same token; refresh does not advance |
|Verified identity | context user/status/error/generation | GET /me authority; old user cleared on replacement; startup unverified view not retained |
|Account lifetime | user.id + credential generation + mounted guard | old results cannot mutate new UI/cache/session |
|Name draft | text/edit generation | trimmed2–80; editable during PATCH; newer edits survive responses/revalidation; route/identity end clears |
|Profile outcome | saved name / uncertain error / verification result | confirmed write distinct from verification; retry GET only |
|Account lock | profile/password/verify/idle | immediate ref gate; protected writes require authenticated status |
|Password section | closed/open, child fields/errors | untrimmed6–72; new differs current; exact confirmation; no persistent secret state |
|Password lifecycle | mount→edit→pending→error or confirmed logout | close/route/user/session/unverified unmount clears; pending close prohibited |

Identity verification loading/error retains the known account tree read-only only in AccountRoute. No authenticated capability is granted by a stale/cached identity.
