import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuthSession } from '../../services/authService';
import { fetchWithAuth } from '../../services/api';

export default function CustomerHome() {
  const session = getAuthSession();
  const customerName = session?.user?.name || 'Welcome Back';
  const customerId = session?.user?.userId;

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMyJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const endpoint = customerId
        ? `/job/my-jobs?customerId=${encodeURIComponent(customerId)}`
        : '/job/my-jobs';

      const data = await fetchWithAuth(endpoint);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.jobs)
          ? data.jobs
          : Array.isArray(data?.data)
            ? data.data
            : [];

      // Sort newest jobs first
      const sorted = [...list].sort((a, b) => {
        const idA = Number(a.jobId ?? a.id ?? 0);
        const idB = Number(b.jobId ?? b.id ?? 0);
        return idB - idA;
      });

      setJobs(sorted);
    } catch (err) {
      setJobs([]);
      setError(err?.message || 'Unable to load your service requests.');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadMyJobs();
  }, [loadMyJobs]);

  const formatCount = (num) => String(num).padStart(2, '0');

  const normalizedStatuses = jobs.map((j) =>
    String(j.status || j.Status || '').toLowerCase()
  );

  const totalJobs = jobs.length;
  const openRequests = normalizedStatuses.filter((s) =>
    ['open', 'pending'].includes(s)
  ).length;
  const activeJobs = normalizedStatuses.filter((s) =>
    ['accepted', 'inprogress', 'in_progress', 'started', 'ongoing'].includes(s)
  ).length;
  const completedJobs = normalizedStatuses.filter((s) =>
    ['completed', 'closed', 'paid'].includes(s)
  ).length;

  const getBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (['completed', 'closed', 'paid'].includes(s)) return 'completed';
    if (['accepted', 'inprogress', 'in_progress', 'started', 'ongoing'].includes(s)) {
      return 'ongoing';
    }
    return 'pending';
  };

  const formatDate = (rawDate) => {
    if (!rawDate) return '';
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-LK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="customer-layout">
      {/* Left Sidebar */}
      <aside className="customer-sidebar">
        <Link to="/" className="brand" style={{ color: 'white', textDecoration: 'none' }}>
          <span className="brand-icon">⚡</span>
          <span>ElectroSL</span>
        </Link>

        <p className="sidebar-label">CUSTOMER MENU</p>

        <nav className="sidebar-nav">
          <Link to="/" className="sidebar-link">
            <span className="menu-icon">🏠</span>
            <span>Back to Home</span>
          </Link>

          <Link to="/customer/home" className="sidebar-link active">
            <span className="menu-icon">⌂</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/customer/post-job" className="sidebar-link">
            <span className="menu-icon">+</span>
            <span>Post New Job</span>
          </Link>

          <Link to="/customer/tracking" className="sidebar-link">
            <span className="menu-icon">⌖</span>
            <span>Live Tracking</span>
          </Link>

          <Link to="/customer/equipment-bill" className="sidebar-link">
            <span className="menu-icon">🧾</span>
            <span>Equipment Bills</span>
          </Link>

          <Link to="/customer/payment" className="sidebar-link">
            <span className="menu-icon">Rs</span>
            <span>Payments</span>
          </Link>

          <Link to="/customer/review" className="sidebar-link">
            <span className="menu-icon">☆</span>
            <span>My Reviews</span>
          </Link>
        </nav>

        <div className="sidebar-emergency">
          <p>Urgent power failure or electrical hazard?</p>
          <Link to="/customer/emergency">🚨 Emergency SOS</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="customer-main">
        <div className="customer-header">
          <div>
            <h2>Customer Dashboard</h2>
            <p>Manage your electrical services in one place.</p>
          </div>

          <Link
            to="/"
            className="secondary-button"
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            ← Back to Home
          </Link>
        </div>

        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div>
            <span className="welcome-small">WELCOME TO ELECTROSL</span>
            <h1>Hello, {customerName}!</h1>
            <p>
              Post your electrical job request and a nearby certified electrician will accept and attend.
            </p>
            <Link to="/customer/post-job" className="welcome-button">
              + Post a New Job
            </Link>
          </div>
          <div className="welcome-icon">⚡</div>
        </div>

        {/* Live Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div>
              <p>Total Jobs</p>
              <h2>{formatCount(totalJobs)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div>
              <p>Active Jobs</p>
              <h2>{formatCount(activeJobs)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🕒</div>
            <div>
              <p>Open Requests</p>
              <h2>{formatCount(openRequests)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div>
              <p>Completed Jobs</p>
              <h2>{formatCount(completedJobs)}</h2>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section className="dashboard-section">
          <div className="section-heading">
            <h2>Quick Actions</h2>
            <p>Access your most-used services.</p>
          </div>

          <div className="quick-actions-grid">
            <Link to="/customer/post-job" className="action-card">
              <span>+</span>
              <strong>Post New Job</strong>
              <small>Request a certified electrician</small>
            </Link>

            <Link to="/customer/tracking" className="action-card">
              <span>⌖</span>
              <strong>Live Tracking</strong>
              <small>Check electrician arrival &amp; progress</small>
            </Link>

            <Link to="/customer/equipment-bill" className="action-card">
              <span>🧾</span>
              <strong>Equipment Bills</strong>
              <small>Review &amp; approve material items</small>
            </Link>

            <Link to="/customer/emergency" className="action-card emergency-card">
              <span>!</span>
              <strong>Emergency SOS</strong>
              <small>Request urgent assistance</small>
            </Link>
          </div>
        </section>

        {/* Customer's Real Service Requests */}
        <section className="dashboard-section">
          <div
            className="section-heading"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div>
              <h2>My Service Requests</h2>
              <p>Real-time status of electrical jobs you have posted.</p>
            </div>

            <button
              type="button"
              onClick={loadMyJobs}
              className="secondary-button"
              style={{ padding: '7px 14px', fontSize: '12px' }}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {error && (
            <div
              className="recent-job-card"
              style={{ borderLeft: '4px solid #dc2626', background: '#fef2f2' }}
            >
              <div>
                <strong style={{ color: '#991b1b' }}>Could not load jobs</strong>
                <p style={{ color: '#b91c1c' }}>{error}</p>
              </div>
              <button
                type="button"
                onClick={loadMyJobs}
                className="secondary-button"
                style={{ padding: '7px 14px', fontSize: '12px' }}
              >
                Retry
              </button>
            </div>
          )}

          {!error && loading ? (
            <div className="recent-job-card">
              <div>
                <strong>Loading your service requests...</strong>
                <p>Fetching your job history from ElectroSL.</p>
              </div>
            </div>
          ) : !error && jobs.length === 0 ? (
            <div className="recent-job-card">
              <div>
                <strong>No service requests yet</strong>
                <p>
                  You haven&apos;t posted any electrical jobs yet. Click &ldquo;+ Post a New Job&rdquo; to request a certified electrician.
                </p>
              </div>
              <Link
                to="/customer/post-job"
                className="primary-button"
                style={{ padding: '9px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                + Post Job
              </Link>
            </div>
          ) : (
            !error &&
            jobs.slice(0, 6).map((job, idx) => {
              const id = job.jobId ?? job.JobId ?? job.id ?? idx;
              const title = job.title || job.Title || 'Electrical Service Request';
              const category = job.category || job.Category || '';
              const address =
                job.address ||
                job.Address ||
                job.locationAddress ||
                job.district ||
                job.District ||
                '';
              const electricianName =
                job.electricianName ||
                job.ElectricianName ||
                job.assignedElectricianName ||
                '';
              const createdDate = formatDate(job.createdAt || job.CreatedAt);
              const status = job.status || job.Status || 'Open';

              const subtitleParts = [
                category && `Category: ${category}`,
                address && `📍 ${address}`,
                electricianName && `👷 Assigned: ${electricianName}`,
                createdDate && `📅 ${createdDate}`,
              ].filter(Boolean);

              return (
                <Link
                  key={id}
                  to="/customer/tracking"
                  state={{ jobId: id }}
                  className="recent-job-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div>
                    <strong>{title}</strong>
                    <p>
                      {subtitleParts.length > 0
                        ? subtitleParts.join('  •  ')
                        : 'Dispatched to nearby verified electricians'}
                    </p>
                  </div>
                  <span className={`status-badge ${getBadgeClass(status)}`}>
                    {status}
                  </span>
                </Link>
              );
            })
          )}
        </section>

        <footer className="customer-footer">
          © {new Date().getFullYear()} ElectroSL • Certified Electrical Service Platform
        </footer>
      </main>
    </div>
  );
}