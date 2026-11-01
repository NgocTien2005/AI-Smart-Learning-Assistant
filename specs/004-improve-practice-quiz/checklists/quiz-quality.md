# Quiz UX Checklist: Lumina

**Purpose**: Standard requirements-quality review trước implement; trọng tâm UX và độ tin cậy lưu.
**Created**:2026-11-01
**Feature**: [spec](../spec.md), [plan](../plan.md).
**Review Ownership**: Reviewer-owned; generation để unchecked. User đã ủy quyền lượt review riêng.
**Marker Semantics**: [x] là yêu cầu đủ chất lượng, không là test hoặc implementation đã đạt.

## Completeness and clarity

- [x] CHK001 Phân cấp history/detail/form có tiêu chí desktop đo được chưa? [Clarity, Spec FR002/SC001]
- [x] CHK002 Lọc/count/selection ngoài filter và thứ tự có định nghĩa rõ chưa? [Completeness, Spec FR003–005]
- [x] CHK003 Năm trạng thái lưu và điều kiện “đã lưu” có phân biệt rõ chưa? [Clarity, Spec FR006–008]
- [x] CHK004 Số yêu cầu/thực tế, nguồn không phù hợp và giới hạn capability có được mô tả đúng chưa? [Consistency, Spec FR012, Assumptions]
- [x] CHK005 Điểm0, null và legacy thiếu lựa chọn có yêu cầu khác nhau chưa? [Coverage, Spec FR004/013, EC01/06]

## Recovery and edge cases

- [x] CHK006 Yêu cầu giữ lựa chọn khi failed/conflict và lựa chọn phục hồi có đầy đủ chưa? [Completeness, Spec US2-AC3/FR008, Plan D04]
- [x] CHK007 Chuyển/tạo/đóng/nộp khi pending và thao tác lặp có outcome rõ chưa? [Coverage, Spec FR009/010/015]
- [x] CHK008 Trường hợp đáp án quay về baseline khi đang lưu có tiêu chí xác nhận đúng chưa? [Coverage, Spec US2-AC2/EC03, Plan D03]
- [x] CHK009 Retry lịch sử/chi tiết có giới hạn tránh write hoặc mất draft chưa? [Consistency, Spec US1-AC4/FR014, Plan D02/05]
- [x] CHK010 Lifecycle địa chỉ, reload và giới hạn beforeunload có nhất quán chưa? [Consistency, Spec FR009/016, Plan D07]

## Nonfunctional and completion

- [x] CHK011 Keyboard/focus/native radio/dialog và nội dung dài được quy định đủ chưa? [Completeness, Spec FR017/SC005]
- [x] CHK012 Quyền owner/enrollment/attempt owner và ranh giới ADMIN có nguồn thực chưa? [Traceability, Spec FR001/018, Plan Constitution II, contracts/quiz.md]
- [x] CHK013 Bằng chứng live/fixture, prerequisites tài nguyên và integration write có giới hạn rõ chưa? [Measurability, Spec FR019/SC006, Plan D08]
- [x] CHK014 Scope frontend/desktop, bảo toàn001–003 và điều kiện hoàn tất có rõ chưa? [Consistency, Spec FR020/SC007]

## Notes

Không phải test plan. Implement đọc gate, không sửa markers. Căn cứ review riêng tại review.md.
