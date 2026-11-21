import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import StatusBadge from '../../components/admin/StatusBadge';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  SearchIcon,
  RefreshCwIcon,
  CheckIcon,
  EyeIcon
} from '../../components/admin/AdminIcons';

const ApprovedElectricians = ({ onSelectApplication }) => {
  const navigate = useNavigate();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const fetchApproved = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getApplications('Approved');
      setTechnicians(data || []);
    } catch (err) {
      console.error('Failed to load approved electricians:', err);
      setError('Unable to fetch approved electricians.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, []);

  const filtered = technicians.filter((tech) => {
    const q = search.toLowerCase();
    return (
      (tech.name && tech.name.toLowerCase().includes(q)) ||
      (tech.email && tech.email.toLowerCase().includes(q)) ||
      (tech.specialization && tech.specialization.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="admin-page-title">Approved Electricians Directory</h1>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              {technicians.length} Licensed
            </span>
          </div>
          <p className="admin-page-subtitle">
            Directory of fully accredited electricians authorized to receive customer job dispatches and submit quotes.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApproved}
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
              <th>NVQ Level 4</th>
              <th>NIC Verified</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading approved electricians...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                  No approved electricians found.
                </td>
              </tr>
            ) : (
              filtered.map((tech) => (
                <tr key={tech.profileId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{tech.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{tech.email}</div>
                  </td>
                  <td style={{ color: '#334155' }}>
                    {tech.specialization || 'General Electrician'}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        color: '#065f46',
                        fontWeight: 600
                      }}
                    >
                      <CheckIcon size={12} color="#065f46" /> Verified
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        color: '#065f46',
                        fontWeight: 600
                      }}
                    >
                      <CheckIcon size={12} color="#065f46" /> Verified
                    </span>
                  </td>
                  <td>
                    <StatusBadge status="Approved" />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectApplication
                          ? onSelectApplication(tech.profileId)
                          : navigate(`/admin/applications/${tech.profileId}`)
                      }
                      className="admin-btn admin-btn-secondary admin-btn-sm"
                    >
                      View Dossier
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

export default ApprovedElectricians;
