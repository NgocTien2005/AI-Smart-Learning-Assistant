import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'

const roleLabels = { STUDENT: 'Học viên', INSTRUCTOR: 'Giảng viên', ADMIN: 'Quản trị viên' }
const labels = { dashboard: 'Tổng quan', admin: 'Quản trị', account: 'Tài khoản', courses: 'Khóa học' }

export default function AppLayout({ children, breadcrumbs = [] }) {
  const { user, logout } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const home = isAdmin ? '/admin' : '/dashboard'
  const courseMatch = location.pathname.match(/^\/courses\/([^/]+)/)
  const crumbs = breadcrumbs.length ? breadcrumbs : [
    { label: labels[isAdmin ? 'admin' : 'dashboard'], to: home },
    ...(courseMatch ? [{ label: labels.courses }] : []),
  ]

  const signOut = () => {
    logout()
    navigate('/auth', { replace: true })
  }

  return <div className="learning-page">
    <header className="learning-header">
      <Link className="learning-brand" to={home}><span>L</span><strong>Lumina LMS</strong></Link>
      <nav aria-label="Điều hướng chính">
        {isAdmin ? <Link to="/admin" aria-current={location.pathname === '/admin' ? 'page' : undefined}>Quản trị</Link> : <Link to="/dashboard" aria-current={location.pathname === '/dashboard' ? 'page' : undefined}>Tổng quan</Link>}
        <Link to="/account" aria-current={location.pathname === '/account' ? 'page' : undefined}>Tài khoản</Link>
        <span className="nav-user">{user?.name || user?.email} · {roleLabels[user?.role]}</span>
        <button type="button" onClick={signOut}>Đăng xuất</button>
      </nav>
    </header>
    {crumbs.length > 0 && <nav className="breadcrumbs" aria-label="Đường dẫn"><ol>{crumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{crumb.to && index < crumbs.length - 1 ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol></nav>}
    {children}
  </div>
}
