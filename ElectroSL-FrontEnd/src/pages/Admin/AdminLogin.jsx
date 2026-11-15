import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5192/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid administrator credentials.');
      }

      if (data.role !== 'Admin') {
        throw new Error('Access denied. Administrator privileges required.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F294A] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-[#0F294A] uppercase bg-blue-100 rounded-full mb-2">
            Restricted Access
          </span>
          <h2 className="text-2xl font-bold text-[#0F294A]">ElectroSL Staff Portal</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign in with your administrator credentials
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@electrosl.lk"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F294A]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#0F294A] hover:bg-[#163a66] text-white font-semibold rounded-lg transition duration-150 disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 text-xs text-slate-500 hover:text-[#0F294A] transition"
          >
            ← Return to Home Page
          </button>
        </form>
      </div>
    </div>
  );
}