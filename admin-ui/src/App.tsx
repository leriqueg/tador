import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { OperatorSessionProvider } from './state/operator-session'
import { ProtectedRoute } from './components/ProtectedRoute'
import AdminLayout from './components/AdminLayout'
import LoginPage from './pages/Login'
import ChangePasswordPage from './pages/ChangePassword'
import DashboardPage from './pages/Dashboard'
import UsersPage from './pages/Users'
import UserDetailPage from './pages/UserDetail'
import TemplatesPage from './pages/Templates'
import TemplatePreviewPage from './pages/TemplatePreview'
import GlobalAccountsPage from './pages/GlobalAccounts'
import GlobalAccountFormPage from './pages/GlobalAccountForm'
import StatisticsPage from './pages/Statistics'
import AuditLogPage from './pages/AuditLog'

export default function App() {
  return (
    <OperatorSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/templates/:code" element={<TemplatePreviewPage />} />
              <Route path="/global-accounts" element={<GlobalAccountsPage />} />
              <Route
                path="/global-accounts/new"
                element={<GlobalAccountFormPage />}
              />
              <Route
                path="/global-accounts/:id/edit"
                element={<GlobalAccountFormPage />}
              />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </OperatorSessionProvider>
  )
}
