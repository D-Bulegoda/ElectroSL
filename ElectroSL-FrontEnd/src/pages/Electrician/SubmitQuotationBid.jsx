import React, { useState } from 'react';

export default function SubmitQuotationBid() {
  const [formData, setFormData] = useState({
    jobId: '',
    serviceCharge: '',
    estimatedTime: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="quotation-page">
      <h1>Submit Quotation / Bid</h1>
      <p>Send your quotation to a customer for a job request.</p>

      <form className="quotation-form" onSubmit={handleSubmit}>
        <label>Job Request</label>
        <select
          name="jobId"
          value={formData.jobId}
          onChange={handleChange}
          required
        >
          <option value="">Select a job</option>
          <option value="1">Electrical Wiring Repair - Job #1</option>
          <option value="2">Ceiling Fan Installation - Job #2</option>
        </select>

        <label>Service Charge (LKR)</label>
        <input
          type="number"
          name="serviceCharge"
          min="1"
          placeholder="Enter your service charge"
          value={formData.serviceCharge}
          onChange={handleChange}
          required
        />

        <label>Estimated Completion Time</label>
        <input
          type="text"
          name="estimatedTime"
          placeholder="e.g. 2 hours"
          value={formData.estimatedTime}
          onChange={handleChange}
          required
        />

        <label>Message to Customer</label>
        <textarea
          name="message"
          rows="4"
          placeholder="Explain your quotation or any additional details..."
          value={formData.message}
          onChange={handleChange}
          required
        />

        <button type="submit">Submit Quotation</button>

        {submitted && (
          <p className="quotation-success">
            Quotation submitted successfully!
          </p>
        )}
      </form>
    </div>
  );
}