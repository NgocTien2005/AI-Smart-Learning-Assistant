# Chat Gemini theo bài học

Mở khóa học bạn sở hữu/đã tham gia → bài học → **Chat Gemini**. Chọn nguồn, đọc thông báo chia sẻ, xác nhận quyền chia sẻ rồi nhập câu hỏi tự do. Model thật trả lời bằng tiếng Việt với trích dẫn được đối chiếu văn bản nguồn. Hỏi tiếp trong cùng màn hình; chỉ 3 cặp hỏi/đáp gần nhất được gửi lại. Đóng, tải lại, đổi bài hoặc xóa hội thoại sẽ bỏ lịch sử trong bộ nhớ.

Chat gọi model thật `gemini-3.1-flash-lite` qua `generateContent`, dùng structured JSON và kiểm tra trích dẫn nguyên văn ở server. Cấu hình này thay pin3.8 sau khi tái hiện503 ở3.8 và kiểm chứng3.1 trả nội dung thật với cùng runtime. Không có mock, tự retry hay chuyển model/paid fallback. API demo hữu hạn cũ vẫn giữ tương thích riêng; tra cứu cục bộ, tóm tắt trích xuất và bài ôn được lưu/chấm là công cụ riêng. Quiz gợi ý trong chat không thay đổi bài ôn đã lưu.

## Cấu hình riêng trên máy development

1. Tạo API key trong [Google AI Studio](https://aistudio.google.com/). Dùng project Free và **tự kiểm tra billing chưa bật**. Không bật paid tier hoặc nhập key vào chat, trình duyệt Lumina, source hay file evidence.
2. Docker Desktop và stack mặc định8080 phải đang hoạt động. Launcher kiểm tra đúng target bằng guard hiện có, không reset/seed/xóa dữ liệu. Chạy từ thư mục repo:

```powershell
powershell -NoProfile -File scripts/start-gemini-chat.ps1
```

3. Terminal riêng yêu cầu gõ `FREE_SELECTED_SOURCE_CHAT`, rồi nhập key ở ô ẩn. Cấu hình chỉ nằm trong process/container runtime (`GEMINI_API_KEY`, `GEMINI_FREE_ONLY_CONFIRMED=true`, `GEMINI_CHAT_ALLOWED=true`); launcher build/recreate backend với `compose.dev.yaml`, không gọi model. Chỉ báo exit code/readiness, không gửi key hoặc ảnh terminal. Mở lại trang5173 nếu cần.
4. Nginx có thể giữ địa chỉ backend cũ sau recreate. Nếu8080 báo502 dù backend healthy, chạy `docker compose exec frontend nginx -s reload`. Không cần xóa volume.

Chạy Compose thông thường/recreate mà không có các giá trị runtime sẽ tắt Gemini. Chạy lại launcher riêng để cấu hình. Cài ứng dụng Gemini trên máy hoặc dùng Gemini web không tự cấu hình API cho Lumina. Có key không chứng minh còn quota hoặc billing đang tắt; server không thể xác minh billing chỉ bằng key. Không tự chuyển model/paid fallback khi hết hạn mức.

## Quyền riêng tư và giới hạn

Chỉ gửi nội dung bài/tài liệu người dùng chủ động chọn và có quyền xem; mặc định chưa chọn/chưa đồng ý. Nguồn ưu tiên lớp văn bản tài liệu đã trích xuất, nếu không có dùng nội dung bài học; UI hiển thị loại nguồn. Tối đa12.000 ký tự đầu, có thông báo cắt ngắn. Không gửi file gốc, định danh tài khoản, token, khóa học khác hay toàn bộ database. Câu hỏi≤2000 ký tự; output≤6000 ký tự. Không hỗ trợ OCR, web search, URL fetching hoặc agent tools.

Theo [điều khoản Free](https://aistudio.google.com/docs/terms#data-use-unpaid), dữ liệu có thể được dùng cải thiện sản phẩm và được người xem xét. **Không gửi thông tin cá nhân, nhạy cảm hoặc tài liệu mật**, dù bạn có quyền đọc chúng. Chat không tạo hội thoại lưu trạng thái ở provider; điều này không thay đổi điều khoản Free. Hãy dùng dữ liệu tổng hợp để nghiệm thu.

Hạn mức cục bộ dùng chung giữa chat/demo:1 yêu cầu đang xử lý,20 yêu cầu/ngày/process,20giây/user; timeout30giây, không tự retry. Đây là giới hạn một process, không phải hệ thống cưỡng chế billing/phân tán. Hủy chỉ dừng chờ; Google có thể đã nhận yêu cầu. Lịch sử không lưu database/localStorage và không được log/upload. Trích dẫn đúng nguyên văn vẫn không bảo đảm suy luận đúng; luôn đối chiếu bài học. Không đủ nguồn thì model phải nói rõ.

## Kiểm chứng

Test/CI dùng transport kiểm soát và stack riêng, không gửi dữ liệu Google. Nghiệm thu model thật phải có runtime ready,2 câu hỏi thật từ UI và kiểm tra nội dung/trích dẫn; xem [feature021](../specs/021-gemini-lesson-chat/verification.md). Feature012/T012 là nghiệm thu demo cũ riêng, không được tự đóng bằng test của chat mới.
