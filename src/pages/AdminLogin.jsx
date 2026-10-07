import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { loginSchema } from '../lib/schemas';
import { useLogin } from '../hooks/queries';
import { useAuthStore, useToastStore } from '../stores';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const logout = useAuthStore(s => s.logout);
  const addToast = useToastStore(s => s.addToast);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const fillAdminCredentials = () => {
    setValue('email', 'admin@demo.com');
    setValue('password', 'admin123');
  };

  const onSubmit = async (data) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      // Validate role
      if (response.user.role !== 'admin') {
        logout();
        addToast({
          type: 'error',
          message: 'Access Denied: You do not possess Administrator privileges. Please use the Passenger Portal.',
        });
        return;
      }

      addToast({
        type: 'success',
        message: 'Admin authentication verified. Welcome to Operations Portal.',
      });
      navigate('/admin');
    } catch (err) {
      // Error handled by mutation
    }
  };

  return (
    <div className="auth-container" style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(239, 68, 68, 0.08) 0%, transparent 60%)' }}>
      <div className="auth-card admin-card-border">
        <div className="auth-header">
          <div
            className="auth-logo"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #991b1b)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)'
            }}
          >
            <Shield size={32} color="white" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span className="admin-badge">RESTRICTED ACCESS</span>
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.6rem' }}>IRCTC Admin Console</h1>
          <p className="auth-subtitle">
            Indian Railways Management & Scheduling System
          </p>
        </div>

        {/* Warning banner */}
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertTriangle size={18} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>
            Authorized personnel only. All access requests and modifications are logged.
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#fca5a5' }}>Admin Official ID / Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                {...register('email')}
                type="email"
                className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="admin@demo.com"
                style={{ paddingLeft: '40px' }}
                id="admin-email"
              />
            </div>
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#fca5a5' }}>Security Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Enter password"
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                id="admin-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={fillAdminCredentials}
              style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}
            >
              <UserCheck size={14} /> Auto-fill Demo Admin
            </button>
          </div>

          <button
            type="submit"
            className="btn btn-danger btn-full btn-lg"
            disabled={loginMutation.isPending}
            id="admin-login-submit"
            style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
          >
            {loginMutation.isPending ? (
              <>
                <div className="spinner" />
                Authenticating Officer...
              </>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem' }}>Not an administrator?</span>
          <Link to="/login" style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
            Passenger Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
