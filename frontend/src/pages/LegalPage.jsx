import { Link } from 'react-router-dom'
import './LearningApp.css'

const content = {
  terms: {
    title: 'Điều khoản dịch vụ',
    intro: 'Các điều khoản này áp dụng khi bạn sử dụng Lumina LMS để học tập hoặc giảng dạy.',
    sections: [
      ['Tài khoản', 'Bạn chịu trách nhiệm bảo vệ thông tin đăng nhập và cung cấp thông tin tài khoản chính xác. Không chia sẻ tài khoản để truy cập trái phép vào khóa học.'],
      ['Nội dung khóa học', 'Giảng viên chỉ đăng nội dung có quyền sử dụng. Học viên không sao chép hoặc phát tán tài liệu ngoài phạm vi được giảng viên cho phép.'],
      ['Sử dụng phù hợp', 'Không sử dụng hệ thống để gây gián đoạn dịch vụ, tải lên nội dung độc hại hoặc xâm phạm quyền của người khác.'],
      ['Thay đổi dịch vụ', 'Lumina có thể cập nhật tính năng để cải thiện độ an toàn và chất lượng. Các thay đổi quan trọng sẽ được thông báo trong ứng dụng.'],
    ],
  },
  privacy: {
    title: 'Chính sách bảo mật',
    intro: 'Lumina LMS chỉ xử lý dữ liệu cần thiết để vận hành tài khoản, khóa học và trợ lý tài liệu.',
    sections: [
      ['Dữ liệu được lưu', 'Hệ thống lưu tên, email, vai trò, khóa học, bài học, lượt tham gia và lịch sử hỏi đáp của người dùng. Mật khẩu luôn được băm trước khi lưu.'],
      ['Mục đích sử dụng', 'Dữ liệu được dùng để xác thực, phân quyền, cung cấp nội dung khóa học và duy trì lịch sử học tập.'],
      ['Tài liệu tải lên', 'Tài liệu được lưu trong hệ thống để người có quyền tải xuống và tra cứu. Nội dung hiện không được gửi tới dịch vụ AI bên ngoài.'],
      ['Bảo vệ tài khoản', 'Liên kết đặt lại mật khẩu có thời hạn, chỉ dùng một lần và token thô không được lưu trong database.'],
    ],
  },
}

function LegalPage({ type }) {
  const page = content[type]
  return (
    <div className="learning-page">
      <header className="learning-header"><Link className="learning-brand" to="/auth"><span>L</span><strong>Lumina LMS</strong></Link><nav><Link to="/auth">Đăng nhập</Link></nav></header>
      <main className="legal-main"><span className="eyebrow">LUMINA LMS</span><h1>{page.title}</h1><p className="legal-intro">{page.intro}</p>{page.sections.map(([title, body]) => <section key={title}><h2>{title}</h2><p>{body}</p></section>)}<p className="legal-updated">Cập nhật: 08/10/2026</p></main>
    </div>
  )
}

export default LegalPage
