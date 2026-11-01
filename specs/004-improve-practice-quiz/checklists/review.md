# Review chất lượng yêu cầu

## Specify review riêng sau generation

Checklist requirements được tạo0/16 unchecked, sau đó review từng nhóm:

| Items | Căn cứ | Kết luận |
| --- | --- | --- |
| Content1–4 | Spec có4US,17AC,20FR,7SC; nhu cầu/giá trị/tình huống, không chỉ định component/code. Các giới hạn frontend/backend là scope do user đặt, không là phương án triển khai. | Đạt4 |
| Completeness1–4 | FR001–020 có hành vi cụ thể; SC001–007 có viewport/bộ ca/điều kiện, không lấy thời gian giả định hoặc KPI chưa đo. Không còn lựa chọn sản phẩm gây đổi contract. | Đạt4 |
| Completeness5–8 |17AC,7EC; assumptions về role, thứ tự, attempt local, snapshot/số câu và runtime chưa khả dụng; scope/frontend-only rõ. | Đạt4 |
| Readiness1–4 | FR001/018/019/020→US4, FR002–005→US1, FR006–010→US2, FR011–013→US3, FR014–017 xuyên US1–4. Outcomes là mục tiêu, không đánh dấu acceptance pass. | Đạt4 |

Review quyết định16/16 đạt chất lượng; chỉ đổi markers sau review này. Không chứng nhận tests/runtime.

## Clarify

0 câu hỏi sản phẩm,0 câu trả lời tích hợp; không tạo Q/A giả. Không sửa spec sau clarify. Revalidation requirements16/16→16/16,0 regression/newly-passing/still-unchecked.

| Taxonomy | Status | Căn cứ |
| --- | --- | --- |
| Functional scope/behavior | Clear |4US, FR001–020, scope/ngoài scope |
| Domain/data | Clear | Attempt owner/lesson, snapshot/draft/version/result và assumptions |
| Interaction/UX | Clear |17AC, trạng thái/keyboard/focus/dialog |
| Nonfunctional | Clear | Desktop, evidence, races/privacy; không thêm scale/SLA ngoài scope |
| Integration/dependencies | Clear | Existing contract/nguồn cục bộ, không dịch vụ ngoài |
| Edge/failure | Clear | EC01–07, FR008–010/014/015 |
| Constraints/tradeoffs | Clear | FR016/018–020, attempt local và draft được xác nhận |
| Terminology | Clear | Attempt/bài ôn, chưa nộp/đã nộp,5 trạng thái lưu |
| Completion signals | Clear | SC001–007, runtime thiếu giữ task mở |
| Misc/placeholders | Clear | Không marker hoặc quyết định còn trống |

Resource question là prerequisite nghiệm thu, không thay đổi quyết định sản phẩm: câu trả lời “ok” chưa xác định course/lesson/attempt. Không viết live trước khi có target phù hợp.

## Standard checklist: review riêng được user ủy quyền

Sau generation0/14 unchecked, reviewer đối chiếu yêu cầu/plan; không chạy app hoặc suy code pass từ checklist:

| CHK | Căn cứ đạt chất lượng yêu cầu |
| --- | --- |
|001 | SC001 nêu hai viewport/đầu panel; D01 có history/detail/form, không chỉ “đẹp”. |
|002 | FR003–005 và D02 định nghĩa filter/count/selection/newest-first/no auto-open. |
|003 | FR006 và D03 xác nhận latest snapshot, không chỉ trạng thái request. |
|004 | FR012/US3-AC2 và D06 phân biệt request/actual/reopen/422/capability cục bộ. |
|005 | FR004/013 và US3-AC3 tách0/null/legacy. |
|006 | US2-AC3, FR008, D04 nêu failed retry/conflict overwrite explicit/load saved confirm. |
|007 | FR009/010/015, D04/05 nêu flush/locks/latest-intent/disabled/duplicate. |
|008 | US2-AC2, EC03, D03 nêu drain queue trước so sánh baseline. |
|009 | US1-AC4, FR014, D02/05 nêu GET retry giữ detail/draft; không replay mutation. |
|010 | FR009/016, assumptions, D07 không hứa attempt URL hoặc unload persistence. |
|011 | US4-AC2, FR017, D01/04 định nghĩa keyboard/focus/native và long text. |
|012 | Contract truy production authenticate/canAccess/attempt owner; không hiểu nhầm requireStudent. |
|013 | FR019/SC006, D08/quickstart tách source/component/live, target và giới hạn integration. |
|014 | FR020/SC007 có scope/old artifacts/no-deploy và thiếu evidence giữ task mở. |

Kết quả review14/14 đạt quality; được phép tick sau bảng này. Đây không phải product acceptance.
