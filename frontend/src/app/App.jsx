import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import AccountPage from '../pages/AccountPage.jsx'
import CourseWorkspacePage from '../pages/CourseWorkspacePage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import LegalPage from '../pages/LegalPage.jsx'
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx'
import '../App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
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
