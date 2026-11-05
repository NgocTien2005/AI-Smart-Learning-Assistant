# Standard requirements-quality checklist: Authentication entry

**Created**:2026-11-03 | **Feature**: [spec.md](../spec.md)
**Purpose**: Requirements quality, not runtime completion. Reviewer-owned; generation leaves markers unchecked, implement reads only.

## Completeness and clarity

- [x] CHK001 Are all four tasks, supported roles and scope boundaries specified? [FR-001/002/004/018]
- [x] CHK002 Are endpoint-specific name/email/raw-password and confirmation rules explicit? [FR-003;contracts]
- [x] CHK003 Are field/operation/pending/confirmed/uncertain/verification states distinguished? [FR-005/009/015]
- [x] CHK004 Are non-secret/password lifetimes defined across mode/link/navigation/session? [FR-007/012/016]

## Consistency and edge cases

- [x] CHK005 Are duplicate gates, stale effects and own versus replacement generation defined? [FR-006/007/010;plan]
- [x] CHK006 Are safe return, role fallback, remember and forgot/history semantics consistent? [FR-008/012]
- [x] CHK007 Does confirmed-entry recovery explicitly require GET-only verification and prohibit mutation replay? [US1-AC4;US2-AC3]
- [x] CHK008 Are general reset400 and precise invalid-link400 separated without invented codes? [FR-013;contracts]
- [x] CHK009 Are forgot privacy,503/429, uncertainty and delivery claims bounded? [FR-011/015]

## Measurability and evidence

- [x] CHK010 Are layout, long content, keyboard/focus/messages and8desktop cases measurable? [FR-017;SC-001/006]
- [x] CHK011 Are production/legacy, component/browser/HTTP/SMTP evidence and isolation/secrets explicit? [FR-019;quickstart]
- [x] CHK012 Are001–007 regression, preserved scope and external evidence completion rules defined? [FR-018/019;SC-007/008]

## Review

Separate review2026-11-03 explicitly authorized by the user. All12 criteria satisfied from requirements/design evidence below; no implementation claim.

- CHK001: Spec US1–5, FR001/002/004/018 define four forms, three sign-in roles and no new capability.
- CHK002: Contract table and plan item3 define trimmed name2–80, normalized email, raw password6–72 and confirmation.
- CHK003: Spec FR005/009/015 and plan items5–7 separate field, operation, confirmation, verification and uncertainty.
- CHK004: Spec FR007/012/016, assumptions and data-model define every lifetime boundary.
- CHK005: Plan item4 and research session decision specify immediate gate, own generation adoption and stale suppression.
- CHK006: Spec FR008/012, plan items2/8 and contract URL paragraph preserve role/return/history.
- CHK007: US1-AC4, US2-AC3, plan item5 explicitly prescribe GET-only recovery or logout, no replay.
- CHK008: US4-AC3, contract exact400 messages and plan item7 define classification without new codes.
- CHK009: US3-AC1/2, FR011/015, contract table and research delivery section bound privacy/errors/uncertainty.
- CHK010: US5-AC1/2/3 and SC001/006 define both viewport sizes, zero overflow, associated messages and focus.
- CHK011: Research production trace and quickstart5–10 distinguish typed evidence, secret policy and isolated targets.
- CHK012: FR018/019, SC007/008 and quickstart10–11 preserve001–007 and explicit delivery gap.
