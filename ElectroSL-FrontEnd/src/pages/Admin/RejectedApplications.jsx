import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  SearchIcon,
  RefreshCwIcon,
  EyeIcon
} from '../../components/admin/AdminIcons';

const RejectedApplications = ({ onSelectApplication }) => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchRejected = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getApplications('Rejected');
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to load rejected applications:', err);
      setError('Unable to fetch rejected applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    return (
      (app.name && app.name.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.specialization && app.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="admin-page-title">Rejected Applications Archive</h1>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                border: '1px solid #fecaca',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              {applications.length} Disqualified
            </span>
          </div>
          <p className="admin-page-subtitle">
            Submissions declined due to invalid certifications, unreadable documents, or failed safety assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRejected}
          disabled={loading}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCwIcon size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-search-box">
          <span className="admin-search-icon">
            <SearchIcon size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Technician</th>
              <th>Specialization</th>
              <th>Audit Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading rejected applications...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  No rejected applications on record.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.profileId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{app.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{app.email}</div>
                  </td>
                  <td style={{ color: '#334155' }}>
                    {app.specialization || 'General Electrician'}
                  </td>
                  <td>
                    <StatusBadge status="Rejected" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectApplication
                          ? onSelectApplication(app.profileId)
                          : navigate(`/admin/applications/${app.profileId}`)
                      }
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      Inspect Dossier
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RejectedApplications;
