import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuthSession, logoutUser } from '../services/authService';
import './UserProfileBadge.css';

export default function UserProfileBadge() {
  const [session, setSession] = useState(() => getAuthSession());
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncAuth = () => setSession(getAuthSession());
    window.addEventListener('electrosl-auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('electrosl-auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Hide on Admin portal or if not logged in
  if (!session?.token || location.pathname.startsWith('/admin')) {
    return null;
  }

  const user = session.user || {};
  const initials = (user.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = () => {
    logoutUser();
    setOpen(false);
    navigate('/login');
  };

  return (
    <div className="profile-badge-wrapper">
      <button className="profile-pill" onClick={() => setOpen((prev) => !prev)}>
        <div className="profile-avatar">{initials}</div>
        <div className="profile-pill-text">
          <span className="profile-pill-name">{user.name || 'User'}</span>
          <span className="profile-pill-role">{session.role}</span>
        </div>
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-header">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
            {(user.permanentAddress || user.permanentDistrict) && (
              <div className="profile-location-tag">
                📍 {[user.permanentAddress, user.permanentDistrict].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          <div className="profile-dropdown-actions">
            {session.role === 'Customer' && (
              <>
                <button onClick={() => { setOpen(false); navigate('/customer/home'); }}>
                  Dashboard
                </button>
                <button onClick={() => { setOpen(false); navigate('/customer/post-job'); }}>
                  + Post a New Job
                </button>
              </>
            )}
            {session.role === 'Electrician' && (
              <button onClick={() => { setOpen(false); navigate('/electrician/dashboard'); }}>
                Electrician Dashboard
              </button>
            )}
            <button className="profile-logout-btn" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}