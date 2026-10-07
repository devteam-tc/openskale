import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Train, Search, User, Ticket, LogOut, Settings, Shield, ChevronDown, Menu } from 'lucide-react';
import { useAuthStore } from '../stores';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowDropdown(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Train size={20} />
          </div>
          <span>RailBook</span>
        </Link>

        {isAuthenticated && (
          <ul className="navbar-nav">
            <li>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                <Search size={16} /> Search
              </Link>
            </li>
            <li>
              <Link to="/bookings" className={`nav-link ${isActive('/bookings') ? 'active' : ''}`}>
                <Ticket size={16} /> My Bookings
              </Link>
            </li>
            {user?.role === 'admin' && (
              <li>
                <Link to="/admin" className={`nav-link ${isActive('/admin') || location.pathname.startsWith('/admin') ? 'active' : ''}`}>
                  <Shield size={16} /> Admin
                </Link>
              </li>
            )}
          </ul>
        )}

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="dropdown" ref={dropdownRef}>
              <div className="navbar-user" onClick={() => setShowDropdown(!showDropdown)}>
                <div className="navbar-avatar">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              {showDropdown && (
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <User size={16} /> Profile
                  </Link>
                  <Link to="/profile?tab=payment" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <Settings size={16} /> Payment Methods
                  </Link>
                  <Link to="/profile?tab=passengers" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <User size={16} /> Saved Passengers
                  </Link>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
