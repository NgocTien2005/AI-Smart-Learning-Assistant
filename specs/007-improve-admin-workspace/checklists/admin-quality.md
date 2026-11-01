# Requirements Quality Checklist: ADMIN Workspace

Purpose: standard reviewer requirements review, not implementation acceptance.
Created:2026-11-01
Feature: [spec.md](../spec.md)
Ownership: reviewer; generated unchecked; [x] means requirement quality satisfied only.

## Scope

- [x] CHK001 Are ADMIN-only managed accounts and excluded capabilities explicitly bounded? [Completeness, FR-001/018; US3-AC4]

- [x] CHK002 Are supported q/page discovery and absent role/status filters unambiguous? [Clarity, FR-002; plan D01/D03]

## Hierarchy

- [x] CHK003 Are initial selection, one editor and list priority measurable? [Clarity, FR-004; US1-AC1/3; SC-001]

- [x] CHK004 Is draft retention across close/switch/filter/page and its end defined? [Coverage, FR-007/017; US4-AC3]

## Contract

- [x] CHK005 Are editable/read-only metadata and missing-versus-zero values defined? [Consistency, FR-005/015; contracts/admin.md]

- [x] CHK006 Are name/role bounds and existing self/managed/linked-record restrictions specified? [Completeness, FR-001/006; US3-AC2]

## Async

- [x] CHK007 Are immediate per-account duplicates, competing actions and independent targets covered? [Coverage, FR-008; EC03]

- [x] CHK008 Are search/page/clamp/filtered selection and obsolete GET outcomes specified? [Coverage, FR-012/013; EC01/05]

- [x] CHK009 Are late outcomes scoped to target/session/lifetime and unrelated drafts preserved? [Clarity, FR-013/014; US2-AC4; US3-AC3]

## Recovery

- [x] CHK010 Are confirmed write/reload failure and read-only retry distinguished? [Clarity, FR-010; SC-004]

- [x] CHK011 Are field/conflict/uncertain operation errors and no automatic replay specified? [Completeness, FR-011; EC04]

## Security

- [x] CHK012 Are current403/401 and authorization loss/recovery distinct? [Consistency, FR-014; plan D06]

## Accessibility

- [x] CHK013 Are native confirmation/cancel/focus and routine direct save defined? [Coverage, FR-009/016; US3-AC1]

- [x] CHK014 Are both desktop sizes, long content, keyboard and reachable controls measurable? [Measurability, US4-AC1/2; SC-001/006]

## Evidence

- [x] CHK015 Are all17AC/18FR/7SC mapped to typed verification and regressions? [Completeness, FR-018; quickstart V01–08]

- [x] CHK016 Are baseline/prior tasks, live-account/user actions and integration prerequisites explicit? [Dependencies, FR-018; SC-005/007]

Implementation reads markers only. No runtime claim follows a checked item.
