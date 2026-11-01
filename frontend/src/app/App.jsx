import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { SessionProvider, useSession } from './SessionContext.jsx'
import AppLayout from '../components/AppLayout.jsx'
import { ErrorState, LoadingState } from '../components/ui/Feedback.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import AccountPage from '../pages/AccountPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import CourseWorkspacePage from '../pages/CourseWorkspacePage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import LegalPage from '../pages/LegalPage.jsx'
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx'
import '../App.css'

function RoleHome() {
  const { status, user, refresh } = useSession()
  if (status === 'loading') return <LoadingState>Đang xác minh phiên đăng nhập…</LoadingState>
  if (status === 'error') return <main className="page-feedback"><ErrorState title="Chưa thể xác minh phiên đăng nhập" onRetry={() => refresh().catch(() => {})} /></main>
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
}

function SessionRecovery() {
  const { status, error, refresh, logout } = useSession()
  if (status !== 'error') return null
  return <main className="session-recovery"><ErrorState title="Không thể xác minh tài khoản" >{error?.message}</ErrorState><div><button className="ui-button ui-button-primary" type="button" onClick={() => refresh().catch(() => {})}>Thử lại</button><button className="ui-button ui-button-secondary" type="button" onClick={logout}>Đăng xuất</button></div></main>
}

function GuardedRoute({ roles, retainAccount = false, children }) {
  const { status, user, sessionExpired, passwordChanged } = useSession()
  const location = useLocation()
  if (retainAccount && user && (status === 'loading' || status === 'error')) return children
  if (status === 'loading') return <LoadingState>Đang xác minh phiên đăng nhập…</LoadingState>
  if (status === 'error') return <SessionRecovery />
  if (status !== 'authenticated') return <Navigate to="/auth" state={{ from: location, sessionExpired, passwordChanged }} replace />
  if (roles && !roles.includes(user?.role)) return <ForbiddenPage />
  return children
}

function ForbiddenPage() {
  const { user } = useSession()
  const home = user?.role === 'ADMIN' ? '/admin' : '/dashboard'
  return <main className="page-feedback"><h1>Không có quyền truy cập</h1><p>Tài khoản hiện tại không được phép mở nội dung này.</p><Link className="ui-button ui-button-primary" to={home}>Về trang phù hợp</Link></main>
}

function NotFoundPage() {
  const { status, user } = useSession()
  return <main className="page-feedback"><h1>Không tìm thấy trang</h1><p>Địa chỉ này không tồn tại hoặc đã được thay đổi.</p><Link className="ui-button ui-button-primary" to={status === 'authenticated' ? (user?.role === 'ADMIN' ? '/admin' : '/dashboard') : '/auth'}>Đi đến trang chính</Link></main>
}

function DashboardRoute() {
  return <GuardedRoute roles={['STUDENT', 'INSTRUCTOR']}><AppLayout><DashboardPage /></AppLayout></GuardedRoute>
}

function AdminRoute() {
  return <GuardedRoute roles={['ADMIN']}><AppLayout><AdminPage /></AppLayout></GuardedRoute>
}

function AccountRoute() {
  return <GuardedRoute retainAccount><AppLayout><AccountPage /></AppLayout></GuardedRoute>
}

function CourseRoute() {
  const { courseId } = useParams()
  return <GuardedRoute roles={['STUDENT', 'INSTRUCTOR']}><AppLayout><CourseWorkspacePage key={courseId} /></AppLayout></GuardedRoute>
}

function ApplicationRoutes() {
  return <Routes>
    <Route path="/" element={<RoleHome />} />
    <Route path="/dashboard" element={<DashboardRoute />} />
    <Route path="/admin" element={<AdminRoute />} />
    <Route path="/account" element={<AccountRoute />} />
    <Route path="/courses/:courseId/*" element={<CourseRoute />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/terms" element={<LegalPage type="terms" />} />
    <Route path="/privacy" element={<LegalPage type="privacy" />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
}

function App() {
  return <BrowserRouter><SessionProvider><ApplicationRoutes /></SessionProvider></BrowserRouter>
}

export default App
