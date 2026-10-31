# Checklist: Chất lượng yêu cầu course workspace

Purpose: Standard reviewer trước triển khai. Feature [spec](../spec.md), [plan](../plan.md).
Created2026-10-31. Checklist đánh giá yêu cầu, không chứng minh tests pass.

## Completeness và clarity
- [x] CHK001 Hai vai trò và ranh giới shell/Bài học so với section khác có xác định đủ? [Completeness, Spec FR001/016/017]
- [x] CHK002 Ưu tiên list/reader có viewport và trạng thái đầu trang đo được? [Measurability, SC001, Plan Thiết kế desktop]
- [x] CHK003 Search/filter/ordinal/selected bị ẩn có kết quả rõ, không mâu thuẫn? [Clarity, US1-AC2/3]
- [x] CHK004 No-selection/invalid/prev-next/history có hành vi riêng? [Coverage, US1-AC4, EC02]

## State, contracts và recovery
- [x] CHK005 Quyền/protected documents/panel capabilities có nguồn và giới hạn rõ? [Consistency, FR001/007/008, contracts/existing-api.md]
- [x] CHK006 Disclosure/draft/File/close/pending/success/failure có lifecycle đầy đủ? [Completeness, US3-AC1–4, data-model.md]
- [x] CHK007 Validation normalized/file business bounds có đo được và không đổi contract? [Clarity, FR010, contracts/existing-api.md]
- [x] CHK008 Duplicate/unmount/late read/write có yêu cầu và cách kiểm phù hợp? [Coverage, FR013, EC06, Plan Risks]
- [x] CHK009 Quiz guard/URL scope và các đường rời giữ nguyên có nêu giới hạn thật? [Consistency, FR005/015, Assumptions]

## Accessibility và verification
- [x] CHK010 Loading/empty/error/missing data và notice ngoài hidden có phân biệt? [Coverage, FR011/012]
- [x] CHK011 Keyboard/focus/File/native dialog/long data có AC quan sát được? [Measurability, US4-AC1/2, EC03/04]
- [x] CHK012 CSS scope, regression, bằng chứng thật/fixture, điều kiện phiên và feature001 có nêu riêng? [Dependency, FR016/017, quickstart V01/V02/V06]

## Generation

12 item mới để unchecked. Reviewer sẽ thực hiện lượt đánh giá riêng theo ủy quyền người dùng; marker không là implementation acceptance.

## Reviewer assessment (sau generation)

Lượt review được người dùng ủy quyền, không thực hiện trong implement. 12/12 chất lượng yêu cầu đạt:

| Item | Căn cứ và kết luận |
| --- | --- |
| CHK001 | FR001/016/017 + Assumptions giới hạn role/section/API; đủ scope |
| CHK002 | SC001 bốn lượt, viewport/zoom; plan mặc định description2 dòng, form đóng; đo bounds được |
| CHK003 | US1-AC2/3 stable ordinal/full selection và thông báo filtered; nhất quán |
| CHK004 | US1-AC4/EC02 không auto select invalid, full-order navigation/URL; rõ |
| CHK005 | Existing-api contract truy production middleware/schema; API và local capability giữ nguyên |
| CHK006 | Data-model transitions+US3AC1–4 bao gồm File, section remount, hidden và pending; đủ lifecycle |
| CHK007 | FR010 bounds2/160/100000/order0–10000/content-or-file/file10MiB và no native raw clipping |
| CHK008 | FR013/EC06, plan context/generations/locks và quickstartdeferred promises; kiểm được |
| CHK009 | Assumptions và contract nêu controlled guard, history không mở rộng bảo vệ; không hứa autosave ngoài baseline |
| CHK010 | FR011/012 + contract notices giữ ngoài hidden, empty/no-match/error và missing có nhãn |
| CHK011 | US4AC1/2+EC03/04 và V02/V04 native blur/focus/File/long keyboard đầy đủ |
| CHK012 | Plan scoped selectors; V01/V06 tách001/runtime/fixture, chưa có session không pass giả |

Không còn quyết định yêu cầu cần hỏi. Kết quả này không nói sản phẩm, API hoặc tests đã đạt.
