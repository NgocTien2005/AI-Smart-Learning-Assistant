---
name: lumina-speckit
description: >-
  Bắt đầu hoặc tiếp tục đặc tả, kế hoạch và task cho thay đổi Lumina LMS bằng
  GitHub Spec Kit; xác định feature, giai đoạn và skill chuyên môn cần dùng.
  Với lỗi nhỏ đã rõ phạm vi, chọn luồng sửa ngắn thay vì bắt tạo đủ bộ feature.
---

# Lumina Spec Kit

## Đầu vào

Đọc [AGENTS.md](../../../AGENTS.md), yêu cầu đang được giao và phần liên quan
trong [development-workflow.md](../../../docs/development-workflow.md).
Kiểm tra diff, mã liên quan và artifacts đang có; không đọc file secret.

## Chọn và tiếp tục luồng

1. Xác định mục tiêu, vai trò, phạm vi đã được cho phép và tiêu chí nghiệm thu.
   Lỗi nhỏ tái hiện được, không có quyết định mới về dữ liệu/API/schema/phạm vi:
   dùng **tái hiện → nguyên nhân → sửa → kiểm chứng**. Không khởi tạo feature hay
   cài extension chỉ để sửa lỗi đó. Nếu phát hiện quyết định thuộc các nhóm trên
   còn chưa rõ, hỏi đúng quyết định trước khi làm phần phụ thuộc.
2. Với luồng đặc tả, kiểm tra `specify version`, help và integration cục bộ.
   Phân biệt CLI đã cài với repository đã init và skill đã được agent nhận diện.
   Không tự cài/nâng cấp/init khi công việc chưa cho phép; nếu thiếu, báo chính
   xác bước setup trong tài liệu. Không tạo hoặc sửa các lệnh/skill `speckit-*`.
3. Đọc metadata, prerequisite script và skill Spec Kit thực sự có trong repo.
   Dùng resolver của phiên bản đó để lấy feature directory và artifact paths;
   không suy từ Git branch, tên thư mục mới nhất hoặc snapshot trong tài liệu.
   Nếu không có feature hợp lệ, nêu thiếu gì; không tự chọn một feature khác.
4. Đọc constitution và artifacts của feature đã resolve. Xác định giai đoạn từ
   nội dung còn thiếu, task chưa xong và bằng chứng, không chỉ từ việc file tồn
   tại. Tiếp tục artifact hiện có, không tạo lại constitution mỗi feature.
5. Dùng các bước đã cài theo quy trình **constitution → specify → clarify →
   plan → checklist → tasks → analyze → implement → converge**. Tên gọi trong
   chat theo integration thực tế. Lệnh thiếu phải được báo là thiếu; một review
   thủ công không trở thành lệnh chính thức. `analyze` giữ read-only, kể cả
   feature state qua cơ chế no-persist của bản đã cài; tôn trọng gate approval
   cho lệnh sửa tiếp nối nếu managed skill yêu cầu. `converge` làm theo giới hạn
   ghi của bản đã cài, không tự sửa code trong bước đối chiếu.

## Đưa ngữ cảnh Lumina vào artifacts

- **Spec:** nhu cầu theo ADMIN/INSTRUCTOR/STUDENT, hành động chính, phạm vi và
  ngoài phạm vi, acceptance scenarios kiểm tra được, trạng thái lỗi và quyền
  trên tài nguyên. Phân biệt capability đang có với capability mới được yêu cầu;
  dùng đúng giới hạn xử lý cục bộ trong tài liệu quy trình.
- **Plan:** truy vết UI → API production → middleware → Prisma; quyết định kỹ
  thuật, consumer bị ảnh hưởng, dữ liệu/migration nếu có, rủi ro và cách kiểm chứng.
  Giữ kiến trúc và dependency hiện có khi đáp ứng yêu cầu.
- **Tasks:** task có ID, file thực tế, thứ tự phụ thuộc, liên kết FR/US/AC và cách
  xác minh. Không đánh dấu xong từ mock hoặc từ kết quả build đơn lẻ.
- Giữ liên kết **yêu cầu → user story → task → bằng chứng kiểm chứng**. Mâu thuẫn
  tài liệu/code phải ghi cả hai đường dẫn; không biến suy luận thành contract.

## Định tuyến theo công việc

| Nhu cầu hiện tại | Skill đọc tiếp |
| --- | --- |
| Đánh giá, bố trí và tiêu chí giao diện | [lumina-ui-design](../lumina-ui-design/SKILL.md) |
| Triển khai hoặc sửa React/CSS | [lumina-react-ui](../lumina-react-ui/SKILL.md) |
| API, quyền và contract giữa các lớp | [lumina-api-contract](../lumina-api-contract/SKILL.md) |
| Model, migration hoặc truy vấn | [lumina-prisma](../lumina-prisma/SKILL.md) |
| Chạy kiểm chứng và bàn giao | [lumina-verify](../lumina-verify/SKILL.md) |

Chỉ tải skill phù hợp với bước đang làm. Không thêm vòng xin phép cho thao tác
thông thường đã được giao; tôn trọng review/approval mà công cụ thực sự yêu cầu
và giải thích nguồn khi gặp gate.

## Đầu ra và hoàn thành

Báo luồng đã chọn, feature directory/giai đoạn cùng căn cứ, artifacts đã cập
nhật, liên kết truy vết và bước kế tiếp. Hoàn thành phần được giao khi artifact
đủ dùng cho bước sau, quyết định chưa rõ được ghi nhận và không vượt phạm vi.
Nếu đã implement, cần bằng chứng từ `lumina-verify`; trạng thái converge không
thay thế kết quả chạy hệ thống.
