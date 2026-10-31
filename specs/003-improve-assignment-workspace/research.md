# Phase 0 — Research quyết định triển khai

Nghiên cứu source độc lập theo speckit-plan, không runtime writes hoặc secret access.

| Decision | Rationale / source | Alternatives considered |
| --- | --- | --- |
| R01 Dùng dữ liệu GET course để tìm/lọc local | routes/courses.js GET course đã trả assignments và submissions theo role; schema Assignment/AssignmentSubmission đủ dữ liệu | API detail/search/version mới ngoài scope |
| R02 Master/detail theo assignment và submission | Panel cũ render mọi nội dung và form; danh sách cần xử lý bị đẩy xuống. Dùng một detail/form chấm đúng selection | Accordion mọi bài vẫn quá nhiều nội dung; route mới không cần |
| R03 Functional updater + target capture | Panel hiện merge từ captured course.assignments gây lost-update. PATCH assignment không kèm submissions, PATCH grade không kèm student: phải merge scalar vào item mới nhất | Replace toàn response làm mất metadata; một global write epoch bỏ nhầm write độc lập |
| R04 Refresh tại panel không unmount | onRefresh=loadCourse đặt loading=true, CourseWorkspacePage trả loading thay panel làm mất draft. GET course tại panel với read generation + mutation revision và pending locks | Parent background load cũng được nhưng tác động rộng hơn lesson/courseDraft; không dùng |
| R05 Guard mounted, operation locks, invalidate read trước/sau write | Response A không được đổi selection/draft B; refresh chồng bất kỳ write phải bị bỏ. Ref locks chặn duplicate trong cùng tick | Chỉ button disabled chưa ngăn duplicate trước rerender; abort không thay kiểm revision |
| R06 URL params optional, invalid khác absent | Course đã dùng query section. Chỉ thêm assignmentId/submissionId qua parent callback, không router mới. Explicit invalid không âm thầm chọn bài khác | Number(value)||null che invalid; local-only selection không đáp ứng refresh/deep link |
| R07 Blank grade gửi null, integer0 hợp lệ | Production route Number(undefined) hoặc Number('') không diễn đạt feedback-only đúng; field và payload phải tường minh. Server không có optimistic grading version | Không hứa giải quyết concurrent edit từ client khác hoặc thay DB |
| R08 Deadline clock và data refresh riêng | Clock mỗi30s/focus phản ánh hạn hiện đang có; refresh GET mới nhận gia hạn server. Bài đã nộp/feedback ở ngoài action gating | Không tin isOverdue snapshot; không autosave/background write |
| R09 Evidence tách loại và external gate | CUA không có browser host, sau đó tự dừng do URL Windows không xác định tin cậy. Chưa xác định tài nguyên ghi live; không dùng fixture làm live | Không lấy token/credential hoặc seed để vượt gate |

Không còn unknown kỹ thuật cần hỏi user. Thiếu môi trường/phiên/resource nghiệm thu được ghi làm task mở, không biến thành quyết định sản phẩm chưa rõ. Runtime grading chỉ có guarantee phía UI theo response hiện có, không thêm server version.
