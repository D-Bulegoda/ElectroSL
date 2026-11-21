import React, { useState } from 'react';
import StatusBadge from './StatusBadge';
import JobAssignModal from './JobAssignModal';
import JobReassignModal from './JobReassignModal';
import JobCancelModal from './JobCancelModal';
import JobDisputeModal from './JobDisputeModal';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  XIcon,
  RefreshCwIcon,
  UsersCheckIcon,
  AlertTriangleIcon,
  MapPinIcon,
  ClockIcon,
  FileTextIcon,
  ShieldAlertIcon
} from './AdminIcons';

export default function JobDetailModal({
  job,
  onClose,
  onRefresh,
  onActionSuccess
}) {
  const [activeActionModal, setActiveActionModal] = useState(null); // 'assign', 'reassign', 'cancel', 'dispute'
  const [refreshing, setRefreshing] = useState(false);

  if (!job) return null;

  const isPending = job.status === 'Pending';
  const isAssigned = job.status === 'Assigned';
  const isDisputed = job.status === 'Disputed';
  const isCompleted = job.status === 'Completed';
  const isCancelled = job.status === 'Cancelled';
  const isDisputeResolved = !!job.disputeResolvedAt;

  const canAssign = isPending && !job.electrician;
  const canReassign = isAssigned;
  const canCancel = (isPending || isAssigned) && !job.payment;
  const canResolveDispute = isDisputed && !isDisputeResolved;

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh(job.jobId);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubActionSuccess = (msg) => {
    setActiveActionModal(null);
    onActionSuccess(msg);
  };

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
          maxWidth: '850px',
          maxHeight: '92vh',
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
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Job #{job.jobId} Dossier
              </h2>
              <StatusBadge status={job.status} />
              {job.isEmergency && <StatusBadge status="emergency" />}
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1'
                }}
              >
                v{job.concurrencyVersion}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
              Created on {formatDateTime(job.createdAt)} &bull; {job.jobType}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh job dossier"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#475569',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: refreshing ? 'not-allowed' : 'pointer'
              }}
            >
              <RefreshCwIcon size={13} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '4px'
              }}
            >
              <XIcon size={20} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Dispute Alert Banner if Disputed */}
          {isDisputed && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '6px',
                backgroundColor: isDisputeResolved ? '#f0fdf4' : '#fff1f2',
                border: `1px solid ${isDisputeResolved ? '#bbf7d0' : '#fecdd3'}`,
                color: isDisputeResolved ? '#15803d' : '#be123c',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <ShieldAlertIcon size={20} color={isDisputeResolved ? '#16a34a' : '#e11d48'} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>
                  {isDisputeResolved ? 'Dispute Mediated & Resolved' : 'Active Job Dispute Under Review'}
                </div>
                <div style={{ marginTop: '0.25rem', lineHeight: 1.45 }}>
                  <strong>Dispute Reason:</strong> {job.disputeReason || 'No specific dispute statement provided.'}
                </div>
                {isDisputeResolved && (
                  <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #bbf7d0', fontSize: '0.775rem' }}>
                    <strong>Resolution ({formatDateTime(job.disputeResolvedAt)}):</strong> {job.disputeResolutionNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cancellation Banner if Cancelled */}
          {isCancelled && (
            <div
              style={{
                padding: '0.85rem 1rem',
                borderRadius: '6px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <ShieldAlertIcon size={20} color="#dc2626" />
              <div>
                <div style={{ fontWeight: 700 }}>Job Cancelled Administratively</div>
                <div style={{ marginTop: '0.25rem' }}>
                  <strong>Reason:</strong> {job.cancellationReason || 'No cancellation reason specified.'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7f1d1d', marginTop: '0.2rem' }}>
                  Cancelled on {formatDateTime(job.cancelledAt)} {job.cancelledByUserName ? `by ${job.cancelledByUserName}` : ''}
                </div>
              </div>
            </div>
          )}

          {/* Customer & Electrician Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Customer Information Card */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '6px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                Customer Dossier
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                {job.customer?.name}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.25rem' }}>
                Phone: {job.customer?.phone || 'N/A'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Email: {job.customer?.email}
              </div>
              {job.customer?.address && (
                <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Address: {job.customer.address}
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '4px',
                    backgroundColor: job.customer?.accountStatus === 'Active' ? '#ecfdf5' : '#fef2f2',
                    color: job.customer?.accountStatus === 'Active' ? '#065f46' : '#991b1b',
                    fontWeight: 600
                  }}
                >
                  Account: {job.customer?.accountStatus || 'Active'}
                </span>
              </div>
            </div>

            {/* Electrician Information Card */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '6px',
                backgroundColor: job.electrician ? '#f8fafc' : '#fffbeb',
                border: `1px solid ${job.electrician ? '#e2e8f0' : '#fde68a'}`
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                Assigned Technician
              </div>
              {job.electrician ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
                      {job.electrician.name}
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: job.electrician.isOnline ? '#ecfdf5' : '#f1f5f9',
                        color: job.electrician.isOnline ? '#065f46' : '#64748b',
                        fontWeight: 600
                      }}
                    >
                      {job.electrician.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#334155', marginTop: '0.25rem' }}>
                    Specialization: {job.electrician.specialization || 'General'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                    Phone: {job.electrician.phone} &bull; Rating: {job.electrician.averageRating > 0 ? `${job.electrician.averageRating.toFixed(1)} ★` : 'New'}
                  </div>
                  {job.assignedAt && (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                      Dispatched on {formatDateTime(job.assignedAt)} {job.assignedByAdminName ? `by ${job.assignedByAdminName}` : ''}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: '0.75rem 0', textAlign: 'center', color: '#92400e' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>No Technician Assigned</div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>
                    Job is unassigned and awaiting operational dispatch.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Description & Location */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
              Job Description & Location
            </div>
            <div style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: 1.5 }}>
              {job.description || 'No description provided.'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem', fontSize: '0.775rem', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPinIcon size={14} color="#64748b" />
                Lat: {job.locationLat}, Lng: {job.locationLng}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ClockIcon size={14} color="#64748b" />
                Type: {job.jobType}
              </span>
              {job.completedAt && (
                <span>Completed: {formatDateTime(job.completedAt)}</span>
              )}
            </div>
          </div>

          {/* Bids Section */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Quotation Bids ({job.bids?.length || 0})
              </div>
            </div>
            {job.bids && job.bids.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {job.bids.map((bid) => (
                  <div
                    key={bid.bidId}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{bid.electricianName}</span>
                      <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>({bid.electricianPhone})</span>
                      {bid.remarks && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>"{bid.remarks}"</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(bid.estimatedAmount)}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatDateTime(bid.submittedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                No electrician bids submitted for this job.
              </div>
            )}
          </div>

          {/* Equipment Claims Section */}
          <div
            style={{
              padding: '1rem',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
              Equipment Claims ({job.equipmentClaims?.length || 0})
            </div>
            {job.equipmentClaims && job.equipmentClaims.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {job.equipmentClaims.map((claim) => (
                  <div
                    key={claim.id}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8125rem'
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{claim.itemName}</span>
                      <span style={{ color: '#64748b', marginLeft: '0.4rem' }}>&times; {claim.quantity}</span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Claimed: {formatCurrency(claim.claimedPrice)}
                        {claim.standardMarketPrice && (
                          <span> &bull; Standard: {formatCurrency(claim.standardMarketPrice)}</span>
                        )}
                        {claim.variancePercentage !== null && claim.variancePercentage !== undefined && (
                          <span style={{ color: claim.variancePercentage > 25 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                            {' '}({claim.variancePercentage > 0 ? `+${claim.variancePercentage.toFixed(1)}%` : `${claim.variancePercentage.toFixed(1)}%`})
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={claim.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                No equipment claimed for this job.
              </div>
            )}
          </div>

          {/* Payment & Review Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Payment Info */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                Payment Transaction
              </div>
              {job.payment ? (
                <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Transaction ID:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>#{job.payment.transactionId}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Total Paid:</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatCurrency(job.payment.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Platform Fee:</span>
                    <span style={{ color: '#0f172a' }}>{formatCurrency(job.payment.platformCommission)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Electrician Payout:</span>
                    <span style={{ color: '#0f172a' }}>{formatCurrency(job.payment.electricianEarning)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Method:</span>
                    <span style={{ color: '#0f172a' }}>{job.payment.paymentMethod}</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No payment transaction recorded.
                </div>
              )}
            </div>

            {/* Review Info */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                Customer Review
              </div>
              {job.review ? (
                <div style={{ fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 700, color: '#d97706', fontSize: '0.95rem' }}>
                      {job.review.rating} ★
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Rating</span>
                  </div>
                  <div style={{ color: '#334155', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{job.review.comment || 'No written comment left.'}"
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.8125rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No customer review submitted.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Footer */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {canAssign && (
              <button
                type="button"
                onClick={() => setActiveActionModal('assign')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <UsersCheckIcon size={16} />
                Assign Electrician
              </button>
            )}

            {canReassign && (
              <button
                type="button"
                onClick={() => setActiveActionModal('reassign')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#d97706',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <RefreshCwIcon size={15} />
                Reassign Electrician
              </button>
            )}

            {canResolveDispute && (
              <button
                type="button"
                onClick={() => setActiveActionModal('dispute')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: '#e11d48',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ShieldAlertIcon size={16} />
                Resolve Dispute
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => setActiveActionModal('cancel')}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: '#dc2626',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                Cancel Job
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1.25rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#334155',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* Subaction Modals */}
      {activeActionModal === 'assign' && (
        <JobAssignModal
          job={job}
          onClose={() => setActiveActionModal(null)}
          onSuccess={handleSubActionSuccess}
        />
      )}

      {activeActionModal === 'reassign' && (
        <JobReassignModal
          job={job}
          onClose={() => setActiveActionModal(null)}
          onSuccess={handleSubActionSuccess}
        />
      )}

      {activeActionModal === 'cancel' && (
        <JobCancelModal
          job={job}
          onClose={() => setActiveActionModal(null)}
          onSuccess={handleSubActionSuccess}
        />
      )}

      {activeActionModal === 'dispute' && (
        <JobDisputeModal
          job={job}
          onClose={() => setActiveActionModal(null)}
          onSuccess={handleSubActionSuccess}
        />
      )}
    </div>
  );
}
