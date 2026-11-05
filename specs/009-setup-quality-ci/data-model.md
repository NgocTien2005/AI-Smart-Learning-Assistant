# Verification state model

No Prisma/schema/migration changes.

| Record | Fields / lifecycle |
| --- | --- |
| Run | revision, event/run identity, three job results; pending→running→passed/failed/not-run |
| Command outcome | approved display command, repo-relative cwd, start/duration, exitCode, passed/failed/skipped; raw output excluded |
| Target | fresh project, loopback port, containers, own network/mount metadata and actual DB; allocated→verified→exercised→cleanup attempted |
| Integration evidence | method/path/status, resource kind/id, remaining-owned-users; explicit allowlist only |
| External acceptance | prior feature/task reference plus evidence/blocker; never a transferred task or inferred hosted/mail success |

Runtime secrets and child-process buffers are not evidence fields. A failed command and failed cleanup are retained independently; neither overwrites the other. Existing project resources are a refusal state, never a resume state. Named volumes are retained locally; no automatic reset/reuse.
