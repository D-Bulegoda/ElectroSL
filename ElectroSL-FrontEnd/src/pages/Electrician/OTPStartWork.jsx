import React, { useState } from 'react';

export default function OTPStartWork() {
  const [otp, setOtp] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  // Sample OTP for frontend testing
  const correctOTP = '123456';

  const handleVerify = (e) => {
    e.preventDefault();

    if (otp === correctOTP) {
      setVerified(true);
      setError('');
    } else {
      setError('Incorrect OTP. Please try again.');
      setVerified(false);
    }
  };

  return (
    <div className="otp-page">
      <h1>OTP Start Work Verification</h1>
      <p>Verify the customer's OTP before starting the job.</p>

      <div className="otp-card">
        <h2>Customer Verification</h2>

        <p><strong>Job ID:</strong> #JOB001</p>
        <p><strong>Customer:</strong> Nimal Perera</p>

        {!verified ? (
          <form onSubmit={handleVerify}>
            <label>Enter Customer OTP</label>

            <input
              type="text"
              maxLength="6"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ''));
                setError('');
              }}
              required
            />

            <button type="submit">Verify OTP</button>

            {error && <p className="otp-error">{error}</p>}
          </form>
        ) : (
          <div className="otp-success">
            <h3>OTP Verified Successfully!</h3>
            <p>You can now start the electrical repair work.</p>
          </div>
        )}

        <small>Demo OTP for testing: 123456</small>
      </div>
    </div>
  );
}