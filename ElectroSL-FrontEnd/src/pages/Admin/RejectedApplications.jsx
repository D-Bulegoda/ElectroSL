import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import { formatDateTime } from '../../utils/formattingHelpers';

const RejectedApplications = ({ onSelectApplication }) => {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Rejected Applications Archive
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Technician applications flagged for invalid credentials, blurred documents, or failed safety assessments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRejected}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#991b1b', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <input
          type="text"
          placeholder="Search by name, email, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 0.85rem',
            borderRadius: '0.375rem',
            border: '1px solid #cbd5e1',
            fontSize: '0.875rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Technician</th>
              <th style={{ padding: '0.75rem 1rem' }}>Specialization</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Date Applied</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading rejected records...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No rejected applications found.
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.profileId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{app.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{app.email}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                    {app.specialization || 'General Electrician'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusBadge status="Rejected" />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                    {formatDateTime(app.createdAt)}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    {onSelectApplication && (
                      <button
                        type="button"
                        onClick={() => onSelectApplication(app.profileId)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          backgroundColor: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        Review / Re-evaluate
                      </button>
                    )}
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

