
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const initialItems = [
  {
    id: 1,
    name: 'Electrical Copper Wire',
    quantity: 20,
    unit: 'meters',
    price: 150,
  },
  {
    id: 2,
    name: 'Power Socket',
    quantity: 3,
    unit: 'units',
    price: 450,
  },
  {
    id: 3,
    name: 'Circuit Breaker',
    quantity: 2,
    unit: 'units',
    price: 1200,
  },
  {
    id: 4,
    name: 'Insulation Tape',
    quantity: 2,
    unit: 'rolls',
    price: 180,
  },
];

export default function ApproveEquipmentBill() {
  const [items] = useState(initialItems);
  const [status, setStatus] = useState('Pending');
  const [message, setMessage] = useState('');

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  const handleDecision = (decision) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${decision.toLowerCase()} this equipment bill?`
    );

    if (!confirmed) return;

    setStatus(decision);

    setMessage(
      decision === 'Approved'
        ? 'Equipment bill approved successfully. Backend integration is pending.'
        : 'Equipment bill rejected. Backend integration is pending.'
    );
  };

  return (
    <div className="page-container equipment-bill-page">

      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="equipment-header">
        <h1 className="page-title">Approve Equipment Bill</h1>
        <p>Review the materials requested for your electrical service.</p>
      </div>

      <div className="equipment-job-summary">
        <div>
          <span>Job Reference</span>
          <strong>JOB-2026-001</strong>
        </div>

        <div>
          <span>Electrician</span>
          <strong>Kasun Perera</strong>
        </div>

        <div>
          <span>Bill Status</span>
          <strong className={`equipment-status ${status.toLowerCase()}`}>
            {status}
          </strong>
        </div>
      </div>

      <section className="equipment-card">
        <h2>Requested Materials</h2>

        <div className="equipment-table-wrapper">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>Equipment</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>LKR {item.price.toLocaleString()}</td>
                  <td>
                    LKR {(item.quantity * item.price).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="equipment-total">
          <span>Total Equipment Cost</span>
          <strong>LKR {total.toLocaleString()}</strong>
        </div>
      </section>

      <div className="equipment-note">
        <strong>Important:</strong>
        <p>
          Please review the requested materials and prices carefully
          before approving the equipment bill.
        </p>
      </div>

      {message && (
        <div className="equipment-message">
          {message}
        </div>
      )}

      {status === 'Pending' && (
        <div className="equipment-actions">
          <button
            type="button"
            className="approve-equipment-button"
            onClick={() => handleDecision('Approved')}
          >
            ✓ Approve Bill
          </button>

          <button
            type="button"
            className="reject-equipment-button"
            onClick={() => handleDecision('Rejected')}
          >
            ✕ Reject Bill
          </button>
        </div>
      )}

    </div>
  );
}
