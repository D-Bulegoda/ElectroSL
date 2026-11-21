import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import UserDetailModal from '../../components/admin/UserDetailModal';
import SuspensionModal from '../../components/admin/SuspensionModal';
import { formatDateTime } from '../../utils/formattingHelpers';
import {
  UsersCheckIcon,
  SearchIcon,
  RefreshCwIcon,
  EyeIcon,
  ShieldAlertIcon,
  CheckIcon,
  XIcon
} from '../../components/admin/AdminIcons';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [selectedRole, setSelectedRole] = useState(''); // '' (All), 'Customer', 'Electrician'
  const [selectedStatus, setSelectedStatus] = useState(''); // '' (All), 'Active', 'Inactive', 'Suspended'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [detailUser, setDetailUser] = useState(null);
  const [suspensionUser, setSuspensionUser] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await adminService.getUsers(selectedRole, searchQuery, selectedStatus);
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to fetch user accounts. Please check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [selectedRole, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadUsers();
  };

  const handleOpenDetail = async (userSummary) => {
    try {
      const detailed = await adminService.getUserDetail(userSummary.userId);
      setDetailUser(detailed);
    } catch (err) {
      console.error('Failed to load user detail:', err);
      setFeedback({ type: 'error', message: 'Unable to load complete user dossier.' });
    }
  };

  const handleActivate = async (user) => {
    if (!window.confirm(`Activate account for ${user.name}? This will restore login permissions.`)) {
      return;
    }

    try {
      setModalSubmitting(true);
      await adminService.activateUser(user.userId, user.concurrencyVersion);
      setFeedback({ type: 'success', message: `Account for ${user.name} activated successfully.` });
      setDetailUser(null);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to activate account.';
      setFeedback({ type: 'error', message: msg });
      loadUsers();
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeactivate = async (user) => {
    if (!window.confirm(`Deactivate account for ${user.name}? The user will be unable to log in until reactivated.`)) {
      return;
    }

    try {
      setModalSubmitting(true);
      await adminService.deactivateUser(user.userId, user.concurrencyVersion);
      setFeedback({ type: 'success', message: `Account for ${user.name} deactivated.` });
      setDetailUser(null);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to deactivate account.';
      setFeedback({ type: 'error', message: msg });
      loadUsers();
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleSuspendConfirm = async (user, reason) => {
    try {
      setModalSubmitting(true);
      await adminService.suspendUser(user.userId, reason, user.concurrencyVersion);
      setFeedback({ type: 'success', message: `Account for ${user.name} has been suspended.` });
      setSuspensionUser(null);
      setDetailUser(null);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to suspend account.';
      setFeedback({ type: 'error', message: msg });
      loadUsers();
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleRestore = async (user) => {
    if (!window.confirm(`Restore account access for ${user.name}? The account status will be set back to Active.`)) {
      return;
    }

    try {
      setModalSubmitting(true);
      await adminService.restoreUser(user.userId, user.concurrencyVersion);
      setFeedback({ type: 'success', message: `Account access restored for ${user.name}.` });
      setDetailUser(null);
      loadUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to restore account.';
      setFeedback({ type: 'error', message: msg });
      loadUsers();
    } finally {
      setModalSubmitting(false);
    }
  };

  // Metrics calculation
  const totalUsersCount = users.length;
  const customersCount = users.filter((u) => u.role === 'Customer').length;
  const electriciansCount = users.filter((u) => u.role === 'Electrician').length;
  const activeCount = users.filter((u) => u.accountStatus === 'Active').length;
  const suspendedCount = users.filter((u) => u.accountStatus === 'Suspended').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1280px' }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Account Management</h1>
          <p className="admin-page-subtitle">
            Manage Customer and Electrician accounts, enforce compliance actions, and review user dossiers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={refreshing}
          className="admin-btn admin-btn-secondary"
        >
          <RefreshCwIcon size={14} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Users'}</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Metric Cards Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Filtered Users</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginTop: '0.25rem' }}>{totalUsersCount}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Customers</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb', marginTop: '0.25rem' }}>{customersCount}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Electricians</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.25rem' }}>{electriciansCount}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Active</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a', marginTop: '0.25rem' }}>{activeCount}</div>
        </div>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Suspended</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626', marginTop: '0.25rem' }}>{suspendedCount}</div>
        </div>
      </div>

      {/* Control Panel: Filters & Search */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        {/* Role Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
          <button
            type="button"
            onClick={() => setSelectedRole('')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedRole === '' ? '#ffffff' : 'transparent',
              color: selectedRole === '' ? '#0f172a' : '#64748b',
              boxShadow: selectedRole === '' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            All Roles
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('Customer')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedRole === 'Customer' ? '#ffffff' : 'transparent',
              color: selectedRole === 'Customer' ? '#2563eb' : '#64748b',
              boxShadow: selectedRole === 'Customer' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Customers
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('Electrician')}
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: selectedRole === 'Electrician' ? '#ffffff' : 'transparent',
              color: selectedRole === 'Electrician' ? '#7c3aed' : '#64748b',
              boxShadow: selectedRole === 'Electrician' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Electricians
          </button>
        </div>

        {/* Status Dropdown & Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'flex-end' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              fontSize: '0.8125rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="">All Account Statuses</option>
            <option value="Active">Active Accounts</option>
            <option value="Inactive">Inactive Accounts</option>
            <option value="Suspended">Suspended Accounts</option>
          </select>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.45rem 2.25rem 0.45rem 0.75rem',
                fontSize: '0.8125rem',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                width: '260px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <SearchIcon size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
            Loading user directory...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
            No accounts found matching the specified filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: '0.75rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>User Info</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Platform State</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Created</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isElec = u.role === 'Electrician';
                  const isCust = u.role === 'Customer';

                  return (
                    <tr
                      key={u.userId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: u.accountStatus === 'Suspended' ? '#fffafb' : '#ffffff'
                      }}
                    >
                      {/* User Info */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{u.phoneNumber || 'No phone'}</div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: isElec ? '#eff6ff' : isCust ? '#f0fdf4' : '#f8fafc',
                            color: isElec ? '#2563eb' : isCust ? '#16a34a' : '#475569',
                            border: `1px solid ${isElec ? '#bfdbfe' : isCust ? '#bbf7d0' : '#e2e8f0'}`
                          }}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Account Status */}
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.2rem 0.55rem',
                            borderRadius: '9999px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            backgroundColor:
                              u.accountStatus === 'Active'
                                ? '#dcfce7'
                                : u.accountStatus === 'Suspended'
                                ? '#fee2e2'
                                : '#f1f5f9',
                            color:
                              u.accountStatus === 'Active'
                                ? '#15803d'
                                : u.accountStatus === 'Suspended'
                                ? '#b91c1c'
                                : '#64748b'
                          }}
                        >
                          <span
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor:
                                u.accountStatus === 'Active'
                                ? '#16a34a'
                                : u.accountStatus === 'Suspended'
                                ? '#dc2626'
                                : '#94a3b8'
                            }}
                          />
                          {u.accountStatus}
                        </span>
                      </td>

                      {/* Platform State */}
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem' }}>
                        {isElec ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <span style={{ color: '#334155', fontWeight: 500 }}>
                              Trade: {u.verificationStatus || 'Unverified'}
                            </span>
                            <span style={{ color: u.isOnline ? '#16a34a' : '#94a3b8' }}>
                              {u.isOnline ? '🟢 Live Online' : '⚪ Offline'}
                            </span>
                          </div>
                        ) : isCust ? (
                          <span style={{ color: '#64748b' }}>Customer Account</span>
                        ) : (
                          <span style={{ color: '#64748b' }}>System Admin</span>
                        )}
                      </td>

                      {/* Created */}
                      <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem' }}>
                        {formatDateTime(u.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(u)}
                            className="admin-btn admin-btn-secondary"
                            title="View full user dossier"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            <EyeIcon size={13} />
                            <span>Dossier</span>
                          </button>

                          {u.accountStatus === 'Active' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleDeactivate(u)}
                                className="admin-btn admin-btn-secondary"
                                title="Deactivate user"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Deactivate
                              </button>
                              <button
                                type="button"
                                onClick={() => setSuspensionUser(u)}
                                className="admin-btn admin-btn-danger"
                                title="Suspend user"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Suspend
                              </button>
                            </>
                          )}

                          {u.accountStatus === 'Inactive' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleActivate(u)}
                                className="admin-btn admin-btn-primary"
                                title="Reactivate user"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Activate
                              </button>
                              <button
                                type="button"
                                onClick={() => setSuspensionUser(u)}
                                className="admin-btn admin-btn-danger"
                                title="Suspend user"
                                style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              >
                                Suspend
                              </button>
                            </>
                          )}

                          {u.accountStatus === 'Suspended' && (
                            <button
                              type="button"
                              onClick={() => handleRestore(u)}
                              className="admin-btn admin-btn-primary"
                              title="Restore account access"
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Dossier Modal */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onSuspend={(u) => setSuspensionUser(u)}
          onRestore={handleRestore}
        />
      )}

      {/* Suspension Mandatory Reason Modal */}
      {suspensionUser && (
        <SuspensionModal
          user={suspensionUser}
          onClose={() => setSuspensionUser(null)}
          onConfirm={handleSuspendConfirm}
          submitting={modalSubmitting}
        />
      )}
    </div>
  );
}

