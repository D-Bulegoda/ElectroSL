import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../services/api';

export default function SignUpElectrician() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    nic: '',
    email: '',
    phone: '',
    address: '',
    qualification: '',
    experience: '',
    password: '',
    confirmPassword: '',
  });

  const [nicDocument, setNicDocument] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setIsError(true);
      setMessage('Passwords do not match!');
      return;
    }

    if (!nicDocument || !certificate) {
      setIsError(true);
      setMessage('Please upload both your NIC document and qualification certificate.');
      return;
    }

    try {
      setLoading(true);
      setIsError(false);
      setMessage('');

      const formPayload = new FormData();
      formPayload.append('fullName', formData.fullName);
      formPayload.append('email', formData.email);
      formPayload.append('password', formData.password);
      formPayload.append('phone', formData.phone);
      formPayload.append('address', formData.address);
      formPayload.append('qualification', formData.qualification);
      formPayload.append('certificate', certificate);
      formPayload.append('nicDocument', nicDocument);

      const response = await fetch(`${API_BASE_URL}/Auth/register-electrician`, {
        method: 'POST',
        body: formPayload,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || 'Registration failed. Please try again.');
        return;
      }

      if (data.userId) {
        localStorage.setItem('electricianId', data.userId);
        localStorage.setItem('userId', data.userId);
      }

      navigate('/electrician/simulator');
    } catch {
      setIsError(true);
      setMessage('Could not connect to the server. Make sure the backend is running on port 5192.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1>Join ElectroSL</h1>
        <p>Register as an Electrician</p>

        <form onSubmit={handleSubmit}>
          <h3>Personal Information</h3>

          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="nic"
            placeholder="NIC Number"
            value={formData.nic}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <textarea
            name="address"
            placeholder="Residential Address"
            value={formData.address}
            onChange={handleChange}
            required
          />

          <h3>Professional Information</h3>

          <select
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            required
          >
            <option value="">Select Qualification</option>
            <option value="NVQ Level 3">NVQ Level 3</option>
            <option value="NVQ Level 4">NVQ Level 4</option>
            <option value="NVQ Level 5">NVQ Level 5</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="number"
            name="experience"
            placeholder="Years of Experience"
            min="0"
            value={formData.experience}
            onChange={handleChange}
            required
          />

          <label>Upload NIC Document</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setNicDocument(e.target.files[0])}
            required
          />

          <label>Upload Qualification Certificate</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setCertificate(e.target.files[0])}
            required
          />

          <h3>Account Security</h3>

          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Continue to 2D Circuit Simulator →'}
          </button>

          {message && (
            <p style={{ color: isError ? '#dc2626' : '#16a34a', marginTop: '10px' }}>
              {message}
            </p>
          )}
        </form>

        <p className="signup-login-link">
          Already have an account?{' '}
          <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}