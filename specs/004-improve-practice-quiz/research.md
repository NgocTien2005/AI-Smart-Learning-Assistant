# Research - Quiz004

| ID | Decision/rationale/alternative | Evidence |
| --- | --- | --- |
| R01 | Keep existing API, no attempt URL/schema. POST requested/actual counts are not persisted; reopen cannot invent them. | backend/src/routes/quizAttempts.js, prisma/schema.prisma |
| R02 | Actual access is attempt owner plus course owner/enrollment, not variable name requireStudent (default no-op); no ADMIN bypass added. | courses.js107-108, quizAttempts.js access helpers, frontend App.jsx |
| R03 | History/detail/disclosure removes source-observed history-below-questions and always-open creation. Browser host unavailable/Chrome New Tab; no live observation. | PracticeQuizPanel.jsx render and LearningApp.css |
| R04 | Compare after draining save queue: saved A to pending B to current A currently falsely confirms saved; revision-dependent finally can leave saving stuck. Label-only fixes rejected. | PracticeQuizPanel.jsx saveDraft/flush, independent read-only research agent |
| R05 | Explicit failed/conflict recovery: current effect retries failed, chooseAnswer removes conflict, retry GET error can be silent. | autosave/chooseAnswer/retrySave |
| R06 | Flush create/switch/close/submit, same-attempt no-op, keep detail on open error. Current create skips flush; same ID reloads; startOpen clears detail; one confirmation literal has broken Vietnamese. | PracticeQuizPanel.jsx handlers |
| R07 | Latest-read/mutation guards, keep parent key/URL/leave registration. | refreshHistory/startOpenAttempt; CourseWorkspacePage.jsx92-124/393 |
| R08 | README.md69-80/122 describes durable lifecycle supported by backend, but frontend risks R04-06 contradict complete preservation. Source and docs both recorded, not assumed pass. Extraction/summary backlog elsewhere is stale and outside scope. | README.md, quizAttempts.js, frontend handlers above |
| R09 | Injected production quiz tests do not cover real authentication/DB. Integration defaults8080 and provisions/SQL-cleans; actual stack frontend8081, db/backend healthy. Not authorized to run those writes. | backend/test/quizAttempts.test.js, scripts/integration-check.mjs, compose.yaml, fresh docker ps |
| R10 | Clean172file baseline.001 T021/022/024/025;002 T018/019/021/022;003 T021/022/024/025 remain open. Resource reply "ok" has no IDs. | ignored baseline manifest, user reply |

All design unknowns resolved from source/research. No secrets/storage read. Evidence is source unless specifically labelled HTTP/browser.
