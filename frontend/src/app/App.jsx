import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from '../components/RequireAuth.jsx'
import AuthPage from '../pages/AuthPage.jsx'
import CourseDetailPage from '../pages/CourseDetailPage.jsx'
import CourseWorkspacePage from '../pages/CourseWorkspacePage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx'
import '../App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/courses/:courseId" element={<RequireAuth><CourseWorkspacePage /></RequireAuth>} />
        <Route path="/demo" element={<CourseDetailPage />} />
        <Route path="/courses/ai-101" element={<Navigate to="/demo" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
