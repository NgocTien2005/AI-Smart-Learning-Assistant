# Standard Requirements Checklist: Assignment workspace

**Purpose**: Reviewer đánh giá chất lượng yêu cầu UX/contract/recovery, không chạy product tests.
**Created**: 2026-10-31
**Feature**: [spec.md](../spec.md), [plan.md](../plan.md)

**Review Ownership**: User ủy quyền lượt review riêng sau generation. Chỉ tick khi requirement-quality đạt.
**Marker Semantics**: Checked không có nghĩa implementation/runtime đã xong. Implement chỉ đọc markers.

## Completeness và clarity

- [x] CHK001 Vai trò và owner/enrollment/ADMIN boundary có được mô tả rõ mà không mở quyền mới? [Completeness, Spec FR001/018]
- [x] CHK002 “Ưu tiên danh sách” có tiêu chí fold/viewport và form mặc định được định nghĩa? [Clarity, Spec FR002, SC001]
- [x] CHK003 Search/filter, group ordering/tie và selection ngoài filter có quy tắc kiểm tra được? [Clarity, Spec FR003–005; Plan D02/03]
- [x] CHK004 Null/0, feedback-only, deadline và bài đã nộp sau hạn có yêu cầu tách biệt? [Completeness, Spec FR006–011]

## Consistency và lifecycle

- [x] CHK005 Draft tạo/sửa/nộp/chấm, thu form/chọn/refresh và kết thúc panel có ranh giới rõ? [Consistency, Spec FR009/014; Plan D04]
- [x] CHK006 Response target A, selection B, independent writes và refresh-vs-write có bảo toàn dữ liệu được định nghĩa? [Coverage, Spec FR015; Plan D05]
- [x] CHK007 Explicit invalid ID, param vắng và history/deep-link có được phân biệt nhất quán? [Clarity, Spec FR016; Plan D03]
- [x] CHK008 Initial loading, empty, no-match, refresh error/retry, pending và success có yêu cầu riêng? [Coverage, Spec FR013, US4-AC4]

## Accessibility và acceptance

- [x] CHK009 Keyboard/focus/disclosure/native dialog cancellation và nội dung dài có criterion đo được? [Measurability, Spec FR012/017, SC005]
- [x] CHK010 Hai vai trò×hai viewport, zoom và bằng chứng ảnh/bounds mới có quy định rõ? [Coverage, Spec SC001/005; Quickstart V02]
- [x] CHK011 Hồi quy lesson/document/quiz/session/account/ADMIN có phạm vi và evidence type riêng? [Coverage, Spec FR018/020; Quickstart V07/08]

## Dependencies và boundaries

- [x] CHK012 Contract hiện có, giới hạn validation, merge metadata và không migration/backend task có căn cứ? [Dependency, Plan D04/05; contracts/assignments.md]
- [x] CHK013 Thiếu runtime/session/resource safe, cấm provision/seed/delete và không dùng mock thay live có được ghi? [Assumption, Spec FR020/022, EC08]
- [x] CHK014 Feature001/002 còn open tasks có được bảo toàn và tách khỏi completion003? [Consistency, Spec FR021; Plan D07]

## Notes

Generated unchecked (0/14). Review riêng ghi trong review.md; trạng thái checked chỉ chất lượng yêu cầu.
