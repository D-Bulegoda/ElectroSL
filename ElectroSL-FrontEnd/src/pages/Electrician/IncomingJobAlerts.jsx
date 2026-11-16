import React, { useState } from 'react';

export default function IncomingJobAlerts() {
  const [jobs, setJobs] = useState([
    {
      id: 1,
      title: 'Electrical Wiring Repair',
      customer: 'Nimal Perera',
      location: 'Negombo',
      description: 'Power outlets are not working properly.',
      date: '12 November 2026',
      urgency: 'Urgent',
    },
    {
      id: 2,
      title: 'Ceiling Fan Installation',
      customer: 'Kamal Silva',
      location: 'Ja-Ela',
      description: 'Need to install two ceiling fans.',
      date: '13 November 2026',
      urgency: 'Normal',
    },
  ]);

  const handleDismiss = (id) => {
    setJobs(jobs.filter((job) => job.id !== id));
  };

  return (
    <div className="incoming-jobs-page">
      <h1>Incoming Job Alerts</h1>
      <p>Review new job requests from customers.</p>

      {jobs.length === 0 ? (
        <div className="no-jobs">
          <h3>No New Job Requests</h3>
          <p>New customer requests will appear here.</p>
        </div>
      ) : (
        <div className="job-alert-list">
          {jobs.map((job) => (
            <div className="job-alert-card" key={job.id}>
              <div className="job-alert-header">
                <h2>{job.title}</h2>
                <span className={job.urgency === 'Urgent' ? 'urgent-tag' : 'normal-tag'}>
                  {job.urgency}
                </span>
              </div>

              <p><strong>Customer:</strong> {job.customer}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Description:</strong> {job.description}</p>
              <p><strong>Preferred Date:</strong> {job.date}</p>

              <button onClick={() => handleDismiss(job.id)}>
                Dismiss Request
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}