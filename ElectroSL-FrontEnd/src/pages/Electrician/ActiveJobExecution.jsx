
import React, { useState } from 'react';

export default function ActiveJobExecution() {
  const [status, setStatus] = useState('Accepted');
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  // Demo OTP for frontend testing only
  const correctOTP = '123456';

  const verifyOTP = () => {
    if (otp === correctOTP) {
      setOtpVerified(true);
      setOtpMessage('OTP verified successfully!');
    } else {
      setOtpVerified(false);
      setOtpMessage('Incorrect OTP. Please try again.');
    }
  };

  const updateStatus = () => {
    if (status === 'Accepted' && otpVerified) {
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

        {status === 'Accepted' && (
          <div className="otp-verification-section">
            <h3>Customer OTP Verification</h3>
            <p>Ask the customer for their OTP before starting the job.</p>

            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setOtpMessage('');
              }}
              maxLength={6}
            />

            <button
              type="button"
              onClick={verifyOTP}
              disabled={otp.length !== 6 || otpVerified}
            >
              Verify OTP
            </button>

            {otpMessage && (
              <p className={otpVerified ? 'otp-success' : 'otp-error'}>
                {otpMessage}
              </p>
            )}

            {otpVerified && (
              <p>You can now start this job.</p>
            )}

            <small>Demo testing OTP: 123456</small>
          </div>
        )}

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
          <button
            className="update-job-button"
            onClick={updateStatus}
            disabled={status === 'Accepted' && !otpVerified}
          >
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
