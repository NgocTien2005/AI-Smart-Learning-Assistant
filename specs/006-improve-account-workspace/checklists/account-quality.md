# Account Requirements Quality Checklist

**Purpose**: Standard reviewer review of UX and session/recovery requirements.
**Created**:2026-11-01
**Feature**:[spec.md](../spec.md), [plan.md](../plan.md)

**Review Ownership**: User authorizes separate review; generation remains unchecked.
**Marker Semantics**: [x] approves requirements quality, never implementation/test success.

## Clarity, completeness and consistency

- [x] CHK001 Are identity/read-only fields and primary profile versus password hierarchy explicit? [Clarity, Spec FR-001/002, US1-AC1; Plan D01]
- [x] CHK002 Are name trim/length boundaries and password untrimmed boundaries defined consistently? [Consistency, Spec FR-003/012, EC-01]
- [x] CHK003 Are duplicate and competing-write rules specified independently of visual pending feedback? [Completeness, Spec FR-004, US1-AC3/US3-AC4]
- [x] CHK004 Are newer and edit-away/back drafts protected by explicit requirements? [Coverage, Spec FR-005/006, US1-AC4/5]
- [x] CHK005 Is confirmed save distinguished from identity failure with the user's retained read-only choice? [Clarity, Spec FR-007, US2-AC1, Clarifications]
- [x] CHK006 Are read-only retry and uncertain-write outcomes separated from mutation replay? [Consistency, Spec FR-008/015, US2-AC2/US3-AC5]
- [x] CHK007 Are session replacement and same-token login cases included in async lifetime requirements? [Coverage, Spec FR-009, EC-04; Plan D03/D06]
- [x] CHK008 Are startup/other-route guards distinguished from known-account read-only retention? [Consistency, Spec FR-010, EC-07; Plan D02]
- [x] CHK009 Are password disclosure focus, clearing and pending restrictions fully stated? [Completeness, Spec FR-011/016, US3-AC1/6]
- [x] CHK010 Are wrong-current field errors separated from operation errors and exact confirmation? [Clarity, Spec FR-012/013, US3-AC2/3]
- [x] CHK011 Are confirmed password logout and uncertain password recovery outcomes unambiguous? [Clarity, Spec FR-014/015, US3-AC4/5]
- [x] CHK012 Are secret lifetime/storage/artifact exclusions specified at every account/session boundary? [Coverage, Spec FR-016, US3-AC6]
- [x] CHK013 Are keyboard, focus, autocomplete and accessible state/error requirements defined? [Completeness, Spec FR-017, US4-AC2]
- [x] CHK014 Are all six desktop role/viewport cases and long-content criteria measurable? [Measurability, Spec SC-001/006, US4-AC1]
- [x] CHK015 Are unchanged server contracts, role boundaries and LMS regressions scoped explicitly? [Consistency, Spec FR-001/018, US4-AC3; contracts/account.md]
- [x] CHK016 Are evidence types, safe live writes, prior failures/tasks and incomplete acceptance rules explicit? [Traceability, Spec FR-019, SC-007; quickstart V01–V08]

## Notes

Implementation reads markers without modifying them. Separate review evidence: [review.md](review.md).
