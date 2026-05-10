import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import Dashboard from './pages/Dashboard'
import GatePassPage from './pages/GatePassPage'
import NoticeBoardPage from './pages/NoticeBoardPage'
import ComplaintsPage from './pages/ComplaintsPage'
import ChatbotPage from './pages/ChatbotPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ProfilePage from './pages/ProfilePage'
import AdminRulesPage from './pages/AdminRulesPage'
import NotificationBell from './components/NotificationBell'

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || 'null')
  } catch {
    sessionStorage.removeItem('user')
    localStorage.removeItem('user')
    return null
  }
}

function ProtectedRoute({ user, children, allowedRoles = null }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getStoredUser()

  const navItems = user
    ? [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/profile', label: 'My Profile' },
        { path: '/gate-pass', label: 'Gate Pass' },
        { path: '/notices', label: 'Notice Board' },
        { path: '/complaints', label: 'Complaints' },
        { path: '/chatbot', label: 'Chatbot' },
        ...(user.role === 'admin'
          ? [{ path: '/admin/rules', label: 'Manage Rules' }]
          : []),
      ]
    : [
        { path: '/login', label: 'Login' },
        { path: '/register', label: 'Register' },
      ]

  const handleLogout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    // Remove old shared chatbot history keys.
    // The updated ChatbotPage no longer uses these global keys,
    // but this cleanup prevents old leaked history from staying in browser storage.
    localStorage.removeItem('chatbotChats')
    localStorage.removeItem('chatbotActiveChat')

    navigate('/login')
    window.location.reload()
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <div className="brand">DIU Hall AI</div>
          <div className="brand-subtitle">Assistant & Automation Platform</div>

          {user && (
            <div className="sidebar-user-row">
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.full_name}</div>
                <div className="sidebar-user-role">
                  {user.role === 'admin' ? 'Administrative' : 'Student'}
                </div>
              </div>

              <NotificationBell />
            </div>
          )}
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </nav>
      </aside>

      <main
        className={`main-content ${location.pathname === '/chatbot' ? 'chat-layout' : ''}`}
      >
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute user={user}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gate-pass"
            element={
              <ProtectedRoute user={user}>
                <GatePassPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notices"
            element={
              <ProtectedRoute user={user}>
                <NoticeBoardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaints"
            element={
              <ProtectedRoute user={user}>
                <ComplaintsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chatbot"
            element={
              <ProtectedRoute user={user}>
                <ChatbotPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/rules"
            element={
              <ProtectedRoute user={user} allowedRoles={['admin']}>
                <AdminRulesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/forgot-password"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <ForgotPasswordPage />
              )
            }
          />

          <Route
            path="/reset-password"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <ResetPasswordPage />
              )
            }
          />

          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
          />

          <Route
            path="/register"
            element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}