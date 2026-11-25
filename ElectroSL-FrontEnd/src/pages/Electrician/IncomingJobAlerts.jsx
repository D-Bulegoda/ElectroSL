import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../../services/api';
import { getAuthSession } from '../../services/authService';

export default function IncomingJobAlerts() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const navigate = useNavigate();

  const loadOpenJobs = async () => {
    try {
      const data = await fetchWithAuth('/job/open');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpenJobs();
  }, []);

  const handleAcceptJob = async (jobId) => {
    const session = getAuthSession();
    if (!session?.user?.userId) {
      navigate('/login');
      return;
    }

    setAcceptingId(jobId);
    try {
      await fetchWithAuth(`/job/${jobId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ electricianId: session.user.userId }),
      });

      // Send electrician straight to active job execution / OTP start
      navigate('/electrician/active-jobs', { state: { jobId } });
    } catch (err) {
      alert(err.message || 'Could not accept job.');
      loadOpenJobs();
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="incoming-jobs-page">
      <h1>Available Job Requests</h1>
      <p>Choose an open job near your current location to attend immediately.</p>

      {loading ? (
        <p>Loading nearby jobs...</p>
      ) : jobs.length === 0 ? (
        <div className="no-jobs">No open jobs at the moment. Check back shortly.</div>
      ) : (
        <div className="job-alert-list">
          {jobs.map((job) => (
            <div key={job.jobId} className="job-alert-card">
              <div className="job-alert-header">
                <h2>{job.title || `${job.jobType} Request #${job.jobId}`}</h2>
                <span className={job.isEmergency ? 'urgent-tag' : 'normal-tag'}>
                  {job.isEmergency ? '🚨 Emergency SOS' : job.jobType || 'Standard'}
                </span>
              </div>

              <p>{job.description}</p>
              <p>
                <strong>Location Coordinates:</strong>{' '}
                {job.locationLat?.toFixed(4)}, {job.locationLng?.toFixed(4)}
              </p>

              <button
                className="primary-button"
                style={{ background: '#087c55', color: '#fff', marginRight: '10px' }}
                disabled={acceptingId === job.jobId}
                onClick={() => handleAcceptJob(job.jobId)}
              >
                {acceptingId === job.jobId ? 'Accepting...' : '✓ Accept & Attend Job'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}