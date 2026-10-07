export const courseDetail = {
  title: 'Nhập môn Trí tuệ nhân tạo (AI 101)',
  badge: 'AI đề xuất',
  description: 'Khám phá nền tảng của trí tuệ nhân tạo, học máy và mạng nơ-ron qua lộ trình trực quan, bài tập thực hành cùng trợ giảng AI cá nhân hóa.',
  instructor: { name: 'TS. Nguyễn Minh Anh', role: 'Giảng viên AI & Machine Learning', initials: 'MA' },
  rating: '4.8',
  reviews: '1.248 đánh giá',
  stats: [
    { icon: 'signal', label: 'Cấp độ', value: 'Cơ bản' },
    { icon: 'calendar', label: 'Thời lượng', value: '8 tuần' },
    { icon: 'book', label: 'Bài học', value: '24 bài' },
    { icon: 'globe', label: 'Ngôn ngữ', value: 'Tiếng Việt' },
  ],
  outcomes: [
    'Hiểu các khái niệm cốt lõi và lịch sử phát triển của AI.',
    'Xây dựng mô hình Machine Learning đầu tiên bằng Python.',
    'Nắm nguyên lý mạng nơ-ron và ứng dụng thị giác máy tính.',
    'Ứng dụng Generative AI và thiết kế prompt có trách nhiệm.',
  ],
  chapters: [
    {
      title: 'Chương 1: Tổng quan về Trí tuệ nhân tạo', meta: '5 bài học • 3 giờ 15 phút', unlocked: true,
      lessons: [
        { type: 'video', title: 'Bài 1.1: AI là gì? Các khái niệm nền tảng', detail: 'Video • 18:30 • Có phụ đề', preview: true },
        { type: 'document', title: 'Bài 1.2: Lược sử phát triển và các cột mốc AI đột phá', detail: 'Tài liệu PDF • 10 trang kèm sơ đồ tóm tắt' },
        { type: 'video', title: 'Bài 1.3: Đạo đức AI và tính minh bạch của thuật toán', detail: 'Video • 20:00 • Case study thực tế' },
        { type: 'quiz', title: 'Bài 1.4: Thử thách AI: Khảo sát nhận thức về AI', detail: 'Quiz AI thích ứng • 10 câu hỏi chấm điểm tự động' },
      ],
    },
    { title: 'Chương 2: Học máy căn bản & Thuật toán Regression', meta: '6 bài học • 4 giờ 45 phút' },
    { title: 'Chương 3: Mạng nơ-ron nhân tạo & Thị giác máy tính', meta: '7 bài học • 5 giờ 30 phút' },
    { title: 'Chương 4: Generative AI, LLM và Tương lai', meta: '6 bài học • 5 giờ' },
  ],
}
