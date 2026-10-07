import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Train, Search, Ticket, Users, CreditCard, User,
  Shield, LogOut, LogIn, ChevronRight, LayoutDashboard,
  Settings, KeyRound
} from 'lucide-react';
import { useAuthStore } from '../stores';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onClose) onClose();
  };

  const isAdmin = user?.role === 'admin';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-brand" onClick={onClose}>
          <div className="brand-icon">
            <Train size={20} />
          </div>
          <div>
            <div style={{ lineHeight: 1.2 }}>RailBook</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
              IRCTC SIMULATION
            </div>
          </div>
        </NavLink>
      </div>

      {/* Nav Content */}
      <div className="sidebar-content">
        {/* Passenger Services */}
        <div>
          <div className="sidebar-section-title">Passenger Services</div>
          <ul className="sidebar-nav">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Search size={18} />
                <span>Search Trains</span>
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <NavLink
                    to="/bookings"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Ticket size={18} />
                    <span>My Bookings</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/profile?tab=passengers"
                    className={({ isActive }) => `sidebar-link ${location.search.includes('tab=passengers') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <Users size={18} />
                    <span>Master Passenger List</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/profile?tab=payment"
                    className={({ isActive }) => `sidebar-link ${location.search.includes('tab=payment') ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <CreditCard size={18} />
                    <span>Payment Methods</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/profile"
                    end
                    className={({ isActive }) => `sidebar-link ${isActive && !location.search ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <User size={18} />
                    <span>User Profile</span>
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Administration Section */}
        <div>
          <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Admin Console</span>
            {isAdmin && <span className="admin-badge">Admin</span>}
          </div>
          <ul className="sidebar-nav">
            {isAdmin ? (
              <>
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `sidebar-link ${isActive ? 'admin-active' : ''}`}
                    onClick={onClose}
                  >
                    <LayoutDashboard size={18} style={{ color: 'var(--danger)' }} />
                    <span>Route & Train Manager</span>
                  </NavLink>
                </li>
              </>
            ) : (
              <li>
                <NavLink
                  to="/admin/login"
                  className={({ isActive }) => `sidebar-link ${isActive ? 'admin-active' : ''}`}
                  onClick={onClose}
                  style={{ color: 'var(--danger)' }}
                >
                  <KeyRound size={18} />
                  <span>Admin Login Portal</span>
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer / User Profile Box */}
      <div className="sidebar-footer">
        {isAuthenticated ? (
          <div className="sidebar-user-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
              <div
                className="navbar-avatar"
                style={{
                  background: isAdmin ? 'var(--admin-accent-gradient)' : 'var(--accent-gradient)',
                  width: 32,
                  height: 32,
                  flexShrink: 0
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: isAdmin ? 'var(--danger)' : 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                  {isAdmin ? 'Administrator' : 'Passenger'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              title="Sign Out"
              style={{ color: 'var(--danger)', padding: '6px' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <NavLink to="/login" className="btn btn-secondary btn-sm btn-full" onClick={onClose}>
              <LogIn size={14} /> Passenger Login
            </NavLink>
            <NavLink to="/admin/login" className="btn btn-danger btn-sm btn-full" onClick={onClose} style={{ fontSize: '0.75rem' }}>
              <Shield size={14} /> Admin Access
            </NavLink>
          </div>
        )}
      </div>
    </aside>
  );
}
