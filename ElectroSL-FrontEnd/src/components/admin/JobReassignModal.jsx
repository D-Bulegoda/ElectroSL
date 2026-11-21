import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { XIcon, RefreshCwIcon, CheckIcon, AlertTriangleIcon } from './AdminIcons';

export default function JobReassignModal({ job, onClose, onSuccess }) {
  const [eligibleList, setEligibleList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedElectricianId, setSelectedElectricianId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [concurrencyError, setConcurrencyError] = useState(null);

  const currentElectricianId = job.electrician?.electricianId;

  useEffect(() => {
    let isMounted = true;
    const fetchEligible = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await adminService.getEligibleElectricians(job.jobId);
        if (isMounted) {
          // Filter out currently assigned technician
          const filtered = (data || []).filter(
            (elec) => elec.userId !== currentElectricianId
          );
          setEligibleList(filtered);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load eligible electricians:', err);
          setError(err.message || 'Unable to retrieve candidate electricians.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEligible();
    return () => { isMounted = false; };
  }, [job.jobId, currentElectricianId]);

  const isReasonValid = reason.trim().length >= 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedElectricianId) {
      setError('Please select a replacement electrician.');
      return;
    }

    if (!isReasonValid) {
      setError('Reassignment requires an operational reason of at least 10 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setConcurrencyError(null);

      await adminService.reassignJob(job.jobId, {
        newElectricianId: parseInt(selectedElectricianId, 10),
        reason: reason.trim(),
        concurrencyVersion: job.concurrencyVersion
      });

      onSuccess(`Job #${job.jobId} successfully reassigned.`);
      onClose();
    } catch (err) {
      console.error('Failed to reassign job:', err);
      if (err.status === 409) {
        setConcurrencyError(err.message || 'Concurrency conflict: This job was updated by another process. Please refresh and review.');
      } else {
        setError(err.message || 'Reassignment failed. Please verify candidate eligibility.');
      }
    } finally {
      setSubmitting(false);
    }
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
        zIndex: 1100,
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
          maxWidth: '580px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCwIcon size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Operational Reassignment
              </h2>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Job #{job.jobId} &bull; Currently: {job.electrician?.name || `Electrician #${currentElectricianId}`} &bull; Concurrency v{job.concurrencyVersion}
              </div>
            </div>
          </div>
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
            <XIcon size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>
            {concurrencyError && (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem'
                }}
              >
                <AlertTriangleIcon size={18} color="#b45309" />
                <div>
                  <div style={{ fontWeight: 600 }}>Concurrency Token Conflict</div>
                  <div>{concurrencyError}</div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.75rem' }}>
                    Please close this modal, refresh the job dossier, and retry with the updated state.
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem'
                }}
              >
                {error}
              </div>
            )}

            {/* Candidate List */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Select Replacement Electrician <span style={{ color: '#ef4444' }}>*</span>
              </label>

              {loading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Evaluating active, verified, online electricians...
                </div>
              ) : eligibleList.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.8125rem'
                  }}
                >
                  No other eligible electricians are currently available online.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                  {eligibleList.map((elec) => {
                    const isSelected = selectedElectricianId === String(elec.userId);
                    return (
                      <div
                        key={elec.userId}
                        onClick={() => setSelectedElectricianId(String(elec.userId))}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? '#d97706' : '#e2e8f0'}`,
                          backgroundColor: isSelected ? '#fffbeb' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: isSelected ? '#b45309' : '#0f172a' }}>
                              {elec.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '0.1rem 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: '#ecfdf5',
                                color: '#065f46',
                                fontWeight: 600
                              }}
                            >
                              Online
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                            {elec.specialization || 'General Electrician'} &bull; Rating: {elec.averageRating > 0 ? `${elec.averageRating.toFixed(1)} ★` : 'New'} &bull; {elec.completedJobsCount} jobs completed
                            {elec.distanceKm !== null && elec.distanceKm !== undefined && (
                              <span> &bull; {elec.distanceKm.toFixed(1)} km away</span>
                            )}
                          </div>
                        </div>

                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? '#d97706' : '#cbd5e1'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: isSelected ? '#d97706' : 'transparent'
                          }}
                        >
                          {isSelected && <CheckIcon size={12} color="#ffffff" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mandatory Reason */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                  Reassignment Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: isReasonValid ? '#16a34a' : '#ef4444' }}>
                  {reason.trim().length}/10 characters minimum
                </span>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the operational reason for reassignment (e.g. Technician reported vehicle mechanical failure en route)..."
                rows={3}
                maxLength={500}
                required
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  border: `1px solid ${reason && !isReasonValid ? '#fca5a5' : '#cbd5e1'}`,
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Reassignment is restricted to Assigned jobs prior to work starting. Reason will be recorded in the audit trail.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#64748b',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedElectricianId || !isReasonValid || !!concurrencyError}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: submitting || !selectedElectricianId || !isReasonValid || !!concurrencyError ? '#94a3b8' : '#d97706',
                border: 'none',
                borderRadius: '6px',
                cursor: submitting || !selectedElectricianId || !isReasonValid || !!concurrencyError ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
