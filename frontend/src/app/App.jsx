import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import AccountPage from '../pages/AccountPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import CourseWorkspacePage from '../pages/CourseWorkspacePage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import LegalPage from '../pages/LegalPage.jsx'
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx'
import { SESSION_EXPIRED_EVENT } from '../services/apiErrors.js'
import '../App.css'

function SessionExpirationHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleExpiration = () => navigate('/auth', { replace: true, state: { sessionExpired: true } })
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpiration)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpiration)
  }, [navigate])

  return null
}

function App() {
  return (
    <BrowserRouter>
      <SessionExpirationHandler />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/admin" element={<RequireAuth><AdminPage /></RequireAuth>} />
        <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
        <Route path="/courses/:courseId" element={<RequireAuth><CourseWorkspacePage /></RequireAuth>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
