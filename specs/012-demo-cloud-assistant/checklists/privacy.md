# Privacy and provider checklist
**Purpose**: Pre-implementation requirements review; user authorizes grounded separate checklist review.
- [x] CHK001 Is original source proof defined independently of email prefixes/client assertions? [FR002,plan3]
- [x] CHK002 Are identity/enrollment/current-source guards required before every provider request? [FR001/002]
- [x] CHK003 Is outgoing data bounded to approved source and finite nonprivate questions? [FR002/003]
- [x] CHK004 Are zero-budget operator limitations, no retry/fallback and default-disabled configuration explicit? [FR006/007]
- [x] CHK005 Are citations/output/safety/oversize/timeout failure criteria specified? [FR004/007,contract]
- [x] CHK006 Are key/source/request/logging exclusions and free data terms explicit? [FR006–008]
- [x] CHK007 Are existing session/local assistant/graded-quiz invariants preserved? [FR005/008]
- [x] CHK008 Is actual model acceptance kept separate from CI/mock/disabled checks? [FR009,SC001/004]

Separate authorized review 2026-11-08: each item has cited FR/plan/contract evidence; all8 criteria satisfied as requirements quality, not runtime completion. Markers frozen during implement.

