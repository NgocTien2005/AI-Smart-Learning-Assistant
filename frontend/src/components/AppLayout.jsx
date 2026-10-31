import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../app/SessionContext.jsx'

const roleLabels = { STUDENT: 'Học viên', INSTRUCTOR: 'Giảng viên', ADMIN: 'Quản trị viên' }
const labels = { dashboard: 'Tổng quan', admin: 'Quản trị', account: 'Tài khoản', courses: 'Khóa học' }
const profileInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'L'
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : parts[0].slice(0, 2)).toLocaleUpperCase('vi')
}

export default function AppLayout({ children, breadcrumbs = [] }) {
  const { user, logout } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'
  const home = isAdmin ? '/admin' : '/dashboard'
  const currentPath = location.pathname.replace(/\/+$/, '') || '/'
  const dashboardRoute = currentPath === '/dashboard'
  const adminRoute = currentPath === '/admin'
  const accountRoute = currentPath === '/account'
  const courseMatch = location.pathname.match(/^\/courses\/([^/]+)/)
  const crumbs = breadcrumbs.length ? breadcrumbs : dashboardRoute || adminRoute || accountRoute ? [] : [
    { label: labels[isAdmin ? 'admin' : 'dashboard'], to: home },
    ...(courseMatch ? [{ label: labels.courses }] : []),
  ]
  const displayName = user?.name?.trim() || user?.email || 'Tài khoản'
  const roleLabel = roleLabels[user?.role] || 'Tài khoản'

  const signOut = () => {
    logout()
    navigate('/auth', { replace: true })
  }

  return <div className={`learning-page${dashboardRoute || adminRoute ? ' role-dashboard-shell' : ''}`}>
    <header className="learning-header">
      <Link className="learning-brand" to={home}><span>L</span><strong>Lumina LMS</strong></Link>
      <nav aria-label="Điều hướng chính">
        {isAdmin ? <Link to="/admin" aria-current={currentPath === '/admin' ? 'page' : undefined}>Quản trị</Link> : <Link to="/dashboard" aria-current={dashboardRoute ? 'page' : undefined}>Tổng quan</Link>}
        <Link to="/account" aria-current={accountRoute ? 'page' : undefined}>Tài khoản</Link>
        <div className="nav-profile" role="group" aria-label={`${displayName}, ${roleLabel}`}>
          <span className="nav-profile-avatar" aria-hidden="true">{profileInitials(user?.name || '')}</span>
          <span className="nav-profile-copy">
            <span className="nav-profile-name" title={displayName}>{displayName}</span>
            <span className="nav-profile-role">{roleLabel}</span>
          </span>
        </div>
        <button type="button" onClick={signOut}>Đăng xuất</button>
      </nav>
    </header>
    {crumbs.length > 0 && <nav className="breadcrumbs" aria-label="Đường dẫn"><ol>{crumbs.map((crumb, index) => <li key={`${crumb.label}-${index}`}>{crumb.to && index < crumbs.length - 1 ? <Link to={crumb.to}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}</li>)}</ol></nav>}
    {children}
  </div>
}
