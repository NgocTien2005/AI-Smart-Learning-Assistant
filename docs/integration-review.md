# Temporary portfolio integration reference

This branch combines the independently reviewable portfolio changes for compatibility testing and a reproducible demo. It is not an omnibus PR into main. No feature PR is merged by this work.

Base: verified origin/main d407a1c (external merge of audit PR5). Security PR6 was externally merged into portfolio/00-audit-speckit, not main; the relevant original security commits are explicitly selected here. Main remains untouched.

| Group | Independent branch / PR | Selected original commits |
|---|---|---|
|B|security/auth-hardening /6|5eddc22,124bf74,fc219b3|
|A|refactor/architecture-cleanup /7|86f96c9,bd2bdf8,45a31b1,67610b2|
|E|test/quality-ci /8|fe69d91,dd42554,c8fc379,fef1fea|
|D|feat/ai-quality-improvements /9|5b6e3ef,47f2a5a,c13333c|
|C|refactor/frontend-ux /10|c89137f,33d7c17,35bda2b,8a1495d|
|G|chore/deployment-foundations /11|d61c7c6,2354639,4c2f23a,31e90ae,65148ad|

Cherry-picks preserve coherent commit boundaries. The courses.js import conflict was resolved by retaining createJoinLimit from security and the extracted assignment/lesson/document/progress imports from architecture. The student join route still applies authorizeRole and createJoinLimit. No auth/schema/API/dependency change was introduced just for integration. Legacy backend/app.js remains unmounted legacy; production auth tests use the production factory after014.

Full combined package checks passed locally at276d03f: frontend npm ci/test/lint/build; backend npm ci/test/quiz and25CIguards. Prisma validate passed after npm ci. Actual isolated HTTP/database/recovery and fresh synthetic seed/Chrome compatibility evidence will be appended after those checks finish. This statement does not replace exact hosted CI, which is recorded separately.

The dependent docs/portfolio-readiness branch targets portfolio/integration-review, not main. Reviewers can merge individual feature PRs in dependency order themselves; a final integration/rebase/retest is required against whatever main revision they choose. No automatic merge, forcepush, deploy, provider call or volume deletion.

## Combined local acceptance

At source276d03f, isolated project lumina-acceptance-ci-1794292705527-bea45e21 passed90HTTP/database operations plus proxy headers/logprivacy/rotation, new DB restoration and upload digest comparison. Separate project lumina-acceptance-ci-demo-1794292732868-817a63 passed247HTTP operations, guarded seed/dryrun/collision/rerun and actual Chrome role matrix with52views plus16auth views across390/768/1280?800/1440?900. Both returned0 and scoped cleanup succeeded; users0, named volumes retained. No SMTP/Google/Gemini request. Exact reports are carried by dependent feature020 evidence. This code tree now forms the verified local reference base; hosted status follows after publication.

## Owner-authorized main consolidation - 2026-11-11

The owner has now explicitly requested merging all completed code into main and rewriting README. This supersedes the earlier no-merge boundary for this operation. PR13 merged into audit66c2727; historical conflicting PR7 is superseded and its branch preserved. Candidate integration/main-portfolio combines origin/main eeccc5b, integration829b815 and audit66c2727. Runtime/tests/CI/schema/Compose/package-lock sources remain byte-identical to the verified integrated source; conflicts were newer documentation copies only. See [main consolidation](main-consolidation.md) for evidence and the operational merge record. No force-push, deploy, private provider call or data/volume deletion.
