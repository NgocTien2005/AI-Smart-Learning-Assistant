# Research

Decision: responsibility routers at identical paths, one authenticated parent.
Rationale: existing quiz factory demonstrates Express composition; preserve
handler behavior rather than invent service abstractions. Alternatives: broad
controller/repository framework or generic CRUD layer rejected as unnecessary.

Decision: extract exact roster effect/form functions/disclosure before larger
workspace state rewrite. Rationale: preserve known lifecycle/draft fixes and
testability. Alternative sweeping hook rewrite risks quiz/navigation regressions.

Decision: keep referenced legacy harness on independent branch; security014
ports its tests first. Removing it here would either break tests or silently
stack unrelated authentication work.
