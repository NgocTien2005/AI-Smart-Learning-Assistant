# Dashboard Requirements Quality Checklist

**Purpose**: Standard review trước triển khai cho ba vai trò.
**Created**: 2026-10-31
**Feature**: [spec.md](../spec.md)

**Review Ownership**: Reviewer sở hữu checklist; người dùng giao agent đánh giá riêng sau generation. `[x]` chỉ nghĩa chất lượng yêu cầu được đánh giá đạt, không phải implementation/tests hoàn tất. Implement chỉ đọc markers.

## Completeness và clarity

- [x] CHK001 Mục tiêu và ranh giới của cả ba vai trò có được xác định rõ? [Completeness, Spec §FR-001, §Phạm vi]
- [x] CHK002 Ưu tiên danh sách có tiêu chí viewport và điều kiện dữ liệu đo được? [Measurability, Spec §SC-001]
- [x] CHK003 Nội dung card, progress và dữ liệu thiếu có được phân biệt đầy đủ? [Coverage, Spec §FR-004–006]
- [x] CHK004 Quy tắc search/filter/sort theo vai trò có rõ và nhất quán với phạm vi hiện có? [Clarity, Spec §FR-003, §FR-007, §FR-011]
- [x] CHK005 Học tiếp/ôn tập/view có được phân biệt bằng trạng thái nguồn? [Clarity, Spec §US1-AC3–6]

## Interaction và accessibility

- [x] CHK006 Điều kiện mặc định, mở/đóng và giữ bản nhập có được mô tả? [Completeness, Spec §FR-008–009]
- [x] CHK007 Focus, keyboard, panel ẩn và dialog có ranh giới tương tác rõ? [Coverage, Spec §FR-020, UI contract §CourseEntryDisclosure]
- [x] CHK008 Validation/normalization, lỗi và thành công của tạo/tham gia có yêu cầu rõ? [Clarity, Spec §FR-010, Data model §Validation]
- [x] CHK009 Vị trí thông báo có được xác định khi biểu mẫu thu gọn? [Consistency, Spec §US4-AC6, Plan §Disclosure]
- [x] CHK010 Typography/spacing/control và chuỗi dài có tiêu chí thống nhất? [Measurability, Spec §SC-008, Plan §Thiết kế desktop]

## ADMIN và quyền

- [x] CHK011 Danh tính, field được sửa và vai trò được quản lý có được giới hạn? [Completeness, Spec §FR-012, HTTP contract §ADMIN]
- [x] CHK012 Confirmation, hủy, linked conflict và effective state có rõ? [Coverage, Spec §FR-013–014]
- [x] CHK013 Bản chỉnh chưa lưu và thao tác trên cùng hàng có yêu cầu nhất quán? [Consistency, Spec §FR-015, Data model §AdminPage]
- [x] CHK014 Total/query/page và trang cuối sau thay đổi dữ liệu có được mô tả? [Coverage, Spec §FR-011, Plan §Đồng bộ dữ liệu]
- [x] CHK015 Ranh giới quyền server/route/session có rõ, không giả định ADMIN bypass? [Consistency, Spec §FR-001, §FR-021, HTTP contract §Ma trận quyền]

## Exception, recovery và phạm vi

- [x] CHK016 Loading/rỗng/no-match/error/refresh/success có phân biệt được bằng yêu cầu? [Coverage, Spec §FR-016]
- [x] CHK017 Pending, phản hồi cũ và phục hồi sau write/read lỗi có được mô tả? [Coverage, Spec §FR-017, Research §D04–06]
- [x] CHK018 Write success cộng refresh failure có nghĩa và đường phục hồi riêng? [Clarity, Data model §Quy tắc merge, UI contract §Ma trận phản hồi]
- [x] CHK019 CSS shared và các trang ngoài phạm vi có ranh giới bảo toàn rõ? [Consistency, Spec §FR-022, Plan §Ranh giới CSS]
- [x] CHK020 Yêu cầu, acceptance và bằng chứng cần thiết có thể truy vết mà không coi mock là runtime? [Traceability, Quickstart §Truy vết, Constitution IV]

## Notes

Generation ngày 2026-10-31: 20 item mới, tất cả unchecked. Không có câu hỏi bổ sung vì focus/depth/reviewer/timing đã được người dùng chỉ định. Không có extension hooks trong repo.

## Reviewer assessment — 2026-10-31

Người dùng ủy quyền review riêng sau generation. 20/20 đạt về chất lượng yêu cầu; không phải kết quả sản phẩm.

| Items | Căn cứ đã đối chiếu | Kết quả |
| --- | --- | --- |
| CHK001–005 | Spec US1–US3, FR001–007/011, SC001/003/004 | Vai trò, dữ liệu, điều hướng và điều kiện nghiệm thu rõ |
| CHK006–010 | Spec US4/US5, plan disclosure/typography, UI contract | Lifecycle, draft, focus, validation và trạng thái có quy tắc cụ thể |
| CHK011–015 | Spec US3, HTTP contract, data-model ADMIN | Quyền/field, conflict, dirty drafts và paging có giới hạn rõ |
| CHK016–018 | Spec FR016–017, research D04–06, state model | Read/write errors, races và refresh-after-success được phân biệt |
| CHK019–020 | Spec FR022, plan CSS scope, quickstart coverage | Giới hạn thay đổi và ma trận bằng chứng đầy đủ |

Không thay spec/constitution để đạt review. Không có item chưa đạt. Các marker này giữ read-only trong implement.