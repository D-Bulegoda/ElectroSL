
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function CheckoutPayment() {
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [message, setMessage] = useState('');

  const serviceCharge = 2500;
  const equipmentCost = 2700;
  const total = serviceCharge + equipmentCost;

  const handlePayment = () => {
    const confirmed = window.confirm(
      `Confirm payment of LKR ${total.toLocaleString()} using ${paymentMethod}?`
    );

    if (!confirmed) return;

    setPaymentStatus('Payment Initiated');
    setMessage(
      'Your payment request is ready. Actual payment gateway integration will be connected by the payment team.'
    );
  };

  return (
    <div className="page-container checkout-page">
      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="checkout-header">
        <h1 className="page-title">Checkout & Payment</h1>
        <p>Review your service charges and select a payment method.</p>
      </div>

      <div className="checkout-layout">
        <section className="checkout-card">
          <h2>Payment Summary</h2>

          <div className="checkout-job-info">
            <div>
              <span>Job Reference</span>
              <strong>JOB-2026-001</strong>
            </div>
            <div>
              <span>Service</span>
              <strong>Electrical Wiring Repair</strong>
            </div>
            <div>
              <span>Electrician</span>
              <strong>Kasun Perera</strong>
            </div>
          </div>

          <div className="checkout-cost-row">
            <span>Electrical Service Charge</span>
            <strong>LKR {serviceCharge.toLocaleString()}</strong>
          </div>

          <div className="checkout-cost-row">
            <span>Equipment Cost</span>
            <strong>LKR {equipmentCost.toLocaleString()}</strong>
          </div>

          <div className="checkout-cost-row">
            <span>Additional Charges</span>
            <strong>LKR 0</strong>
          </div>

          <div className="checkout-total">
            <span>Total Amount</span>
            <strong>LKR {total.toLocaleString()}</strong>
          </div>
        </section>

        <section className="checkout-card">
          <h2>Select Payment Method</h2>

          <div className="payment-methods">
            {['Card', 'Bank Transfer', 'Cash'].map((method) => (
              <label
                key={method}
                className={`payment-method ${
                  paymentMethod === method ? 'selected' : ''
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                  disabled={paymentStatus !== 'Pending'}
                />

                <span>{method}</span>
              </label>
            ))}
          </div>

          <div className="payment-status">
            <span>Payment Status</span>
            <strong>{paymentStatus}</strong>
          </div>

          {message && (
            <div className="checkout-message">
              {message}
            </div>
          )}

          {paymentStatus === 'Pending' && (
            <button
              type="button"
              className="checkout-pay-button"
              onClick={handlePayment}
            >
              Pay LKR {total.toLocaleString()}
            </button>
          )}

          <p className="payment-security-note">
            Your payment will be processed securely through the project's
            payment gateway once integration is completed.
          </p>
        </section>
      </div>
    </div>
  );
}
