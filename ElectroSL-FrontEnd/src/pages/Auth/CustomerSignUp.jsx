import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { registerCustomer } from '../../services/authService';
import LocationPicker from '../../components/maps/LocationPicker';
import './CustomerAuth.css';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kurunegala', 'Puttalam',
  'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
];

export default function CustomerSignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/customer/post-job';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    permanentAddress: '',
    permanentDistrict: 'Colombo',
    password: '',
    confirmPassword: '',
  });
  const [permanentLocation, setPermanentLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await registerCustomer({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        permanentAddress: form.permanentAddress,
        permanentDistrict: form.permanentDistrict,
        permanentLocation,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* Left Visual Hero */}
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
          <div className="auth-hero-badge">⚡ Verified Electricians Across Sri Lanka</div>
          <h2>
            Power Up Your Home with <span>Trusted Pros</span>
          </h2>
          <p>
            Create your customer profile once to post maintenance or new construction jobs,
            compare certified NVQ electrician bids, and track work live.
          </p>

          <div className="auth-feature-grid">
            <div className="auth-feature-card">
              <strong>NVQ Accredited</strong>
              <span>Admin-verified technicians</span>
            </div>
            <div className="auth-feature-card">
              <strong>Flexible Job Sites</strong>
              <span>Set any job location per request</span>
            </div>
            <div className="auth-feature-card">
              <strong>Live Tracking</strong>
              <span>OTP-verified job start & finish</span>
            </div>
            <div className="auth-feature-card">
              <strong>Transparent Bills</strong>
              <span>Approve equipment quotes first</span>
            </div>
          </div>
        </div>

        <div className="auth-visual-footer">
          © {new Date().getFullYear()} ElectroSL Platform • Safe & Certified Electrical Services
        </div>
      </div>

      {/* Right Sign-Up Form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1>Create Customer Profile</h1>
            <p>Set up your profile and permanent address to start posting jobs.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Kasun Perera"
              />
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="kasun@example.com"
                />
              </div>

              <div className="auth-field">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0771234567"
                />
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label>Permanent Address</label>
                <input
                  type="text"
                  name="permanentAddress"
                  required
                  value={form.permanentAddress}
                  onChange={handleChange}
                  placeholder="No. 45, High Level Rd, Homagama"
                />
              </div>

              <div className="auth-field">
                <label>District</label>
                <select
                  name="permanentDistrict"
                  value={form.permanentDistrict}
                  onChange={handleChange}
                >
                  {DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <span className="auth-field-hint">
              Your permanent address is saved to your profile. You can pick a different location for each job.
            </span>

            <button
              type="button"
              className="auth-map-toggle"
              onClick={() => setShowMap((prev) => !prev)}
            >
              {permanentLocation
                ? '📍 Permanent map pin saved (click to change)'
                : showMap
                ? 'Hide Map Pin Picker'
                : '📍 Optional: Pin Permanent Location on Map'}
            </button>

            {showMap && (
              <div className="auth-map-box">
                <LocationPicker onLocationSelect={setPermanentLocation} />
              </div>
            )}

            <div className="auth-row">
              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                />
              </div>

              <div className="auth-field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? 'Creating Profile...' : 'Create Profile & Continue →'}
            </button>
          </form>

          <div className="auth-footer-links">
            <span>
              Already have an account?{' '}
              <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`}>
                Log in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}