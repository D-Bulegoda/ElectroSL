import React, { useState } from 'react';

export default function ActiveJobExecution() {
  const [status, setStatus] = useState('Accepted');

  const updateStatus = () => {
    if (status === 'Accepted') {
      setStatus('In Progress');
    } else if (status === 'In Progress') {
      setStatus('Completed');
    }
  };

  return (
    <div className="active-job-page">
      <h1>Active Job Execution</h1>
      <p>Manage your accepted and ongoing jobs.</p>

      <div className="active-job-card">
        <div className="active-job-header">
          <h2>Electrical Wiring Repair</h2>
          <span className={`job-status ${status.toLowerCase().replace(' ', '-')}`}>
            {status}
          </span>
        </div>

        <div className="active-job-details">
          <p><strong>Job ID:</strong> #JOB001</p>
          <p><strong>Customer:</strong> Nimal Perera</p>
          <p><strong>Location:</strong> Negombo</p>
          <p><strong>Description:</strong> Repair faulty electrical outlets.</p>
          <p><strong>Service Charge:</strong> LKR 2,500</p>
        </div>

        <div className="job-progress">
          <h3>Job Progress</h3>
          <div className="progress-steps">
            <span className={status !== 'Accepted' ? 'completed-step' : 'current-step'}>
              Accepted
            </span>
            <span className={status === 'In Progress' || status === 'Completed' ? 'completed-step' : ''}>
              In Progress
            </span>
            <span className={status === 'Completed' ? 'completed-step' : ''}>
              Completed
            </span>
          </div>
        </div>

        {status !== 'Completed' ? (
          <button className="update-job-button" onClick={updateStatus}>
            {status === 'Accepted' ? 'Start Job' : 'Mark as Completed'}
          </button>
        ) : (
          <p className="job-completed-message">
            Job completed successfully!
          </p>
        )}
      </div>
    </div>
  );
}