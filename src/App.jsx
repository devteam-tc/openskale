import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/RouteGuards';

import LoginPage from './pages/Login';
import AdminLoginPage from './pages/AdminLogin';
import SignupPage from './pages/Signup';
import ProfilePage from './pages/Profile';
import SearchTrainsPage from './pages/SearchTrains';
import BookTicketPage from './pages/BookTicket';
import BookingsListPage from './pages/BookingsList';
import AdminRoutesPage from './pages/AdminRoutes';
import { Menu, Shield } from 'lucide-react';
import { useAuthStore } from './stores';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore(s => s.user);

  // Hide sidebar on standalone auth pages
  const isAuthPage = ['/login', '/admin/login', '/signup'].includes(location.pathname);

  if (isAuthPage) {
    return <main style={{ minHeight: '100vh', width: '100%' }}>{children}</main>;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content-wrapper">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-ghost btn-sm"
              style={{ display: 'inline-flex', padding: '6px' }}
              title="Toggle Menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isAdminRoute ? 'Admin Control Centre' : 'IRCTC Railway Reservation Portal'}
              </span>
              {isAdminRoute && <span className="admin-badge">Admin</span>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                <span>{user.name}</span>
                {user.role === 'admin' && (
                  <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Admin</span>
                )}
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Toast />
        <MainLayout>
          <Routes>
            {/* Passenger Login & Registration */}
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

            {/* Dedicated Admin Login */}
            <Route path="/admin/login" element={<GuestRoute><AdminLoginPage /></GuestRoute>} />

            {/* Passenger Services & Search */}
            <Route path="/" element={<SearchTrainsPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/book" element={<ProtectedRoute><BookTicketPage /></ProtectedRoute>} />
            <Route path="/bookings" element={<ProtectedRoute><BookingsListPage /></ProtectedRoute>} />

            {/* Admin Management Protected Route */}
            <Route path="/admin" element={<AdminRoute><AdminRoutesPage /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </Router>
    </QueryClientProvider>
  );
}
