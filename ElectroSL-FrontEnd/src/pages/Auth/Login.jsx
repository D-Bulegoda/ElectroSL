import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import './CustomerAuth.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // loginUser saves the session and automatically syncs live GPS coordinates for Electricians
      const session = await loginUser({ email: email.trim(), password });

      if (redirectParam && session.role === 'Customer') {
        navigate(redirectParam, { replace: true });
        return;
      }

      if (session.role === 'Admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (session.role === 'Electrician') {
        navigate('/electrician/dashboard', { replace: true });
      } else {
        navigate('/customer/home', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual-panel">
        <Link to="/" className="auth-brand">
          <div className="auth-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill="#090d16" />
            </svg>
          </div>
          ElectroSL
        </Link>

        <div className="auth-hero-content">
          <div className="auth-hero-badge">⚡ Live GPS Dispatch &amp; Role Access</div>
          <h2>
            Welcome Back to <span>ElectroSL</span>
          </h2>
          <p>
            Sign in to post electrical jobs, accept nearby service requests, or track active work in real time.
          </p>
        </div>

        <div className="auth-visual-footer">
          © {new Date().getFullYear()} ElectroSL Platform
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Sign In</h1>
            <p>Access your customer or electrician account.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <span className="auth-field-hint">
              Electricians: Your live GPS location updates automatically on sign-in to match you with nearby jobs.
            </span>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? 'Signing In...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-footer-links">
            <span>
              New customer?{' '}
              <Link to={`/signup?redirect=${encodeURIComponent(redirectParam || '/customer/post-job')}`}>
                Create Customer Profile
              </Link>
            </span>
            <span>
              Are you an electrician?{' '}
              <Link to="/electrician/signup">Electrician Sign Up</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}