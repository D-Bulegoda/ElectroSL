import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function SignUpElectrician() {
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

  const [certificate, setCertificate] = useState(null);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    setMessage('Registration form submitted successfully!');

    console.log(formData);
    console.log(certificate);
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

          <button type="submit">
            Submit Registration
          </button>

          {message && <p>{message}</p>}

        </form>

        <p className="signup-login-link">
  Already have an account?{' '}
  <Link to="/login">Login here</Link>
</p>

      </div>
    </div>
  );
}