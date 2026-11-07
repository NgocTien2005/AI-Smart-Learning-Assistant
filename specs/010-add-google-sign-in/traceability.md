# Traceability

| Requirement / story | Tasks | Implementation / evidence | Status |
| --- | --- | --- | --- |
| FR-001, US2 | T004/008/011/014/016 | Stable-subject-only lookup, no create/email merge path; all-role router fixtures, DB uniqueness; actual Google pending | Implemented, provider acceptance OPEN |
| FR-002, US1 | T004–007/011/014/016 | Authenticated link challenge, current owner/version/email, conditional update/unique conflict, Account status/recovery; HTTP401/status persistence and DB constraint | Implemented; real link pending |
| FR-003 | T003/005/006/008/009 | RS256, fixed rotating JWKS, claims/nonce checks, bounded single-use browser/intent/version challenge; unit/router negative cases | Fixture PASS; actual provider pending |
| FR-004 | T005/006/008/013/014/016 | Existing createToken/publicUser/authenticate and /me; three-role fixtures plus existing HTTP role/locking/session revocation regression | PASS within fixture/HTTP scope; real Google roles pending |
| FR-005 | T008/010/011/013/014 | Password handlers/schema fields unchanged; full frontend + backend/quiz and isolated auth/reset fixtures | PASS;008 real mail acceptance remains separate |
| FR-006 | T007/009–011/013 | Session generation, component lifetime, synchronous operation gates, /me-only recovery, uncertain-link status check; stale/competition tests | PASS component fixtures |
| FR-007, SC-003 | T007/010/011/015 | Auth/Account minimal additions; two desktop observations and screenshots, keyboard progression; inactive document focus-ring limitation | PASS observed optional UI; configured popup layout pending T016 |
| FR-008/009, US3 | T003/009/011/012 | Disabled state, private setup guide, public ID only, env variants ignored, no Google/SMTP tokens retained | PASS code/docs/fixture scope |
| FR-010, SC-004 | T001/002/013–017 | Verification distinguishes layers, command/cwd/exit, real DB identity/cleanup, provider gate | Local checks PASS; T016 OPEN; hosted run recorded separately |
| FR-011 | T001/012/014 | Feature008 reproduced dev fix, explicit proxy/CORS and default8080 safe refresh; local8081 untouched | PASS observed |

SC-001/002 have implementation and fixture/HTTP evidence; actual Google end-to-end remains T016. Counts do not replace acceptance evidence. No task moved out of008/009;008 T026 remains open under its own policy limit.
