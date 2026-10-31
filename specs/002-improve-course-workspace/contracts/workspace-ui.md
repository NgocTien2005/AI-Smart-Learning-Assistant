# Contract tương tác workspace

- Scope `.course-workspace` cho shell; `.course-workspace--lessons` cho nội dung Bài học; no root/global/shared CSS mutation.
- Header/nav giữ role actions; list/search/reader trước form đóng. Instructor header CTA chuyển lessons+open bằng guard, lesson heading trigger open/close; student không create.
- Search/filter giữ selected/URL. Ordinal từ toàn lessons; aria-current cho selected, thông báo selected ngoài filter. Invalid ID khác chưa chọn; không fetch panel khi invalid.
- Reader tools trước content; body không clipping; tool panels giữ children/keys và API. Previous/next theo toàn khóa; management link qua changeSection.
- Controlled LessonCreateDisclosure props open/onOpenChange/draft/errors/pending/onChange/onFile/onRemove/onSubmit/resetVersion. Page owns File/draft/request/notice; component refs/focus, không network/session/open state riêng.
- Hidden region không layout/Tab, Escape cục bộ; open focus title; close/success restore trigger khi panel-owned focus, không cướp focus đã chuyển. Pending text/file/remove/submit disabled, close còn dùng. Native file reset chỉ khi success/remove, không gán path, giữ raw hợp lệ qua trim.
- Read failure retry GET, write failure giữ draft/file, confirmed success notice không hidden; no fake zeros/success; duplicate locks synchronous, late responses gated to course/page.
- Navigation controls dùng safelyNavigateFromQuiz trước đổi context; không thay quiz/internal panels hoặc thêm cam kết persistence khi unload/history.
