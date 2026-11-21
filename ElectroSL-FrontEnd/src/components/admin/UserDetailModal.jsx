import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import { XIcon, CheckIcon, ShieldAlertIcon } from './AdminIcons';

export default function UserDetailModal({ user, onClose, onActivate, onDeactivate, onSuspend, onRestore }) {
  if (!user) return null;

  const isCustomer = user.role === 'Customer';
  const isElectrician = user.role === 'Electrician';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(11, 21, 40, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
        backdropFilter: 'blur(2px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {user.name}
              </h2>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: isElectrician ? '#eff6ff' : '#f0fdf4',
                  color: isElectrician ? '#2563eb' : '#16a34a',
                  border: `1px solid ${isElectrician ? '#bfdbfe' : '#bbf7d0'}`
                }}
              >
                {user.role}
              </span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor:
                    user.accountStatus === 'Active'
                      ? '#dcfce7'
                      : user.accountStatus === 'Suspended'
                      ? '#fee2e2'
                      : '#f1f5f9',
                  color:
                    user.accountStatus === 'Active'
                      ? '#15803d'
                      : user.accountStatus === 'Suspended'
                      ? '#b91c1c'
                      : '#64748b'
                }}
              >
                {user.accountStatus}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0' }}>
              User ID: #{user.userId} • Concurrency Version: v{user.concurrencyVersion} • Member since {formatDateTime(user.createdAt)}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Suspension Alert if applicable */}
          {user.accountStatus === 'Suspended' && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                padding: '0.85rem 1rem',
                display: 'flex',
                gap: '0.75rem'
              }}
            >
              <div style={{ color: '#dc2626', flexShrink: 0 }}>
                <ShieldAlertIcon size={20} />
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#991b1b' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                  Account Suspended by Administration
                </div>
                <div>
                  <strong>Reason:</strong> {user.suspensionReason || 'No reason provided.'}
                </div>
                {user.suspendedAt && (
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                    Suspended on {formatDateTime(user.suspendedAt)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deactivation Alert if inactive */}
          {user.accountStatus === 'Inactive' && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.85rem 1rem',
                fontSize: '0.8125rem',
                color: '#475569'
              }}
            >
              <strong>Account Deactivated:</strong> This account was marked inactive{user.deactivatedAt ? ` on ${formatDateTime(user.deactivatedAt)}` : ''}. Login access is disabled.
            </div>
          )}

          {/* Contact & Profile Info */}
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
              Contact & Profile Details
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid #f1f5f9',
                fontSize: '0.8125rem'
              }}
            >
              <div>
                <span style={{ color: '#64748b' }}>Email: </span>
                <strong style={{ color: '#0f172a' }}>{user.email}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Phone: </span>
                <strong style={{ color: '#0f172a' }}>{user.phoneNumber || 'Not provided'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Address: </span>
                <span style={{ color: '#0f172a' }}>{user.address || 'Not registered'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Account Status: </span>
                <span style={{ fontWeight: 600, color: user.isActive ? '#16a34a' : '#dc2626' }}>
                  {user.accountStatus} {user.isActive ? '(Active)' : '(Disabled)'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Specific Stats */}
          {isCustomer && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                Customer Activity & Spend Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{user.totalCustomerJobs ?? user.totalJobsPosted ?? 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Total Jobs</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2563eb' }}>{user.activeCustomerJobs || 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Active Jobs</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16a34a' }}>{user.completedCustomerJobs || 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Completed</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(user.totalCustomerSpend || 0)}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Total Spend</div>
                </div>
              </div>

              {/* Recent Jobs list */}
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Recent Job Requests</h4>
              {user.recentCustomerJobs && user.recentCustomerJobs.length > 0 ? (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Job ID</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Type</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Description</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.recentCustomerJobs.map((job) => (
                        <tr key={job.jobId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>#{job.jobId}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{job.jobType}</td>
                          <td style={{ padding: '0.5rem 0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{ fontWeight: 600, color: job.status === 'Completed' ? '#16a34a' : '#2563eb' }}>{job.status}</span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{formatDateTime(job.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No job history recorded.</p>
              )}
            </div>
          )}

          {/* Electrician Specific Profile & Stats */}
          {isElectrician && (
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginBottom: '0.6rem' }}>
                Electrician Accreditation & Performance
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.75rem',
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  border: '1px solid #f1f5f9',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>Specialization: </span>
                  <strong style={{ color: '#0f172a' }}>{user.specialization || 'General Electrician'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Accreditation Status: </span>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        user.verificationStatus === 'Approved'
                          ? '#16a34a'
                          : user.verificationStatus === 'Revoked'
                          ? '#b91c1c'
                          : '#d97706'
                    }}
                  >
                    {user.verificationStatus || 'Unverified'} {user.isApprovedByAdmin ? '(Approved)' : ''}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Live Dispatch Availability: </span>
                  <span style={{ fontWeight: 600, color: user.isOnline ? '#16a34a' : '#64748b' }}>
                    {user.isOnline ? '🟢 Online' : '⚪ Offline'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Documents Attached: </span>
                  <span>{user.hasNicDocument ? 'NIC ✓' : 'No NIC'} • {user.hasNvqCertificate ? 'NVQ ✓' : 'No NVQ'}</span>
                </div>
              </div>

              {/* Performance Counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a' }}>{user.totalElectricianBids || 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Bids Placed</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#2563eb' }}>{user.assignedJobsCount || 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Assigned Jobs</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#16a34a' }}>{user.completedElectricianJobs || 0}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>Completed</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#d97706' }}>
                    ★ {user.averageRating ? user.averageRating.toFixed(1) : '0.0'}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{user.totalReviewsCount || 0} Reviews</div>
                </div>
              </div>

              {/* Recent Assigned Jobs */}
              <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Recent Assigned Jobs</h4>
              {user.recentAssignedJobs && user.recentAssignedJobs.length > 0 ? (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <tr>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Job ID</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Customer</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Description</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.recentAssignedJobs.map((job) => (
                        <tr key={job.jobId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>#{job.jobId}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{job.customerName}</td>
                          <td style={{ padding: '0.5rem 0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.description}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            <span style={{ fontWeight: 600, color: job.status === 'Completed' ? '#16a34a' : '#2563eb' }}>{job.status}</span>
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem', color: '#64748b' }}>{formatDateTime(job.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No assigned jobs recorded.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {user.accountStatus === 'Active' && (
              <>
                <button
                  type="button"
                  onClick={() => onDeactivate(user)}
                  className="admin-btn admin-btn-secondary"
                  style={{ fontSize: '0.75rem' }}
                >
                  Deactivate Account
                </button>
                <button
                  type="button"
                  onClick={() => onSuspend(user)}
                  className="admin-btn admin-btn-danger"
                  style={{ fontSize: '0.75rem' }}
                >
                  Suspend Account
                </button>
              </>
            )}

            {user.accountStatus === 'Inactive' && (
              <>
                <button
                  type="button"
                  onClick={() => onActivate(user)}
                  className="admin-btn admin-btn-primary"
                  style={{ fontSize: '0.75rem' }}
                >
                  Activate Account
                </button>
                <button
                  type="button"
                  onClick={() => onSuspend(user)}
                  className="admin-btn admin-btn-danger"
                  style={{ fontSize: '0.75rem' }}
                >
                  Suspend Account
                </button>
              </>
            )}

            {user.accountStatus === 'Suspended' && (
              <button
                type="button"
                onClick={() => onRestore(user)}
                className="admin-btn admin-btn-primary"
                style={{ fontSize: '0.75rem' }}
              >
                Restore Account Access
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.75rem' }}
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
