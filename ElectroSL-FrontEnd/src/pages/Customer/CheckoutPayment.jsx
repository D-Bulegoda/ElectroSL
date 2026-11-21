import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { getCheckoutSummary, processPayment } from '../../services/mockPaymentService';

export default function CheckoutPayment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const initialJobId = searchParams.get('jobId') || location.state?.jobId || 1;
  const [jobId, setJobId] = useState(Number(initialJobId));

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected payment method: "Card" (FullDigital) vs "Cash" (CashSplit)
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    loadCheckoutSummary(jobId);
  }, [jobId]);

  const loadCheckoutSummary = async (targetJobId) => {
    setLoading(true);
    setError('');
    setMessage('');
    setReceipt(null);
    setPaymentStatus('Pending');

    try {
      const data = await getCheckoutSummary(targetJobId);
      setSummary(data);
      if (!data.isPaymentEligible) {
        setError(data.ineligibilityReason || 'This job is currently ineligible for payment.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load checkout summary. Please ensure you are logged in as the job owner.');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!summary || !summary.isPaymentEligible) {
      alert(error || 'This job is not eligible for payment.');
      return;
    }

    const tier = paymentMethod === 'Cash' 
      ? summary.pricingOptions?.cashSplit 
      : summary.pricingOptions?.fullDigital;

    const onlineAmount = tier ? tier.customerPaysOnline : summary.grossJobValue;
    const methodDescription = paymentMethod === 'Cash' 
      ? `CashSplit (LKR ${onlineAmount.toLocaleString()} platform fee online + LKR ${tier?.customerPaysCash.toLocaleString()} cash on-site)` 
      : `FullDigital (LKR ${onlineAmount.toLocaleString()} full amount online)`;

    const confirmed = window.confirm(
      `Confirm payment for Job #${summary.jobId} using ${methodDescription}?`
    );

    if (!confirmed) return;

    setSubmitting(true);
    setMessage('');

    try {
      const canonicalMethod = paymentMethod === 'Cash' ? 'CashSplit' : 'FullDigital';
      const result = await processPayment({
        jobId: summary.jobId,
        paymentMethod: canonicalMethod,
      });

      setPaymentStatus('Payment Successful');
      setReceipt(result);
      setMessage(result.message || 'Payment processed successfully!');
    } catch (err) {
      setError(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTier = paymentMethod === 'Cash'
    ? summary?.pricingOptions?.cashSplit
    : summary?.pricingOptions?.fullDigital;

  return (
    <div className="page-container checkout-page">
      <Link to="/customer/home" className="back-link">
        ← Back to Dashboard
      </Link>

      <div className="checkout-header">
        <h1 className="page-title">Checkout & Payment</h1>
        <p>Review your authoritative service charges and select a payment method.</p>
      </div>

      {loading ? (
        <div className="checkout-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#64748b' }}>Loading authoritative checkout summary from server...</p>
        </div>
      ) : error && !summary ? (
        <div className="checkout-card" style={{ padding: '30px' }}>
          <div style={{ color: '#b91c1c', marginBottom: '16px', fontWeight: '500' }}>
            ⚠️ {error}
          </div>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
            Payments require an authenticated customer account and an active, eligible job with an established agreed labour charge.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="checkout-pay-button"
              style={{ width: 'auto', padding: '10px 20px', marginTop: 0 }}
              onClick={() => loadCheckoutSummary(jobId)}
            >
              Retry
            </button>
          </div>
        </div>
      ) : summary ? (
        <div className="checkout-layout">
          {/* Left Column: Authoritative Financial Summary */}
          <section className="checkout-card">
            <h2>Payment Summary</h2>

            <div className="checkout-job-info">
              <div>
                <span>Job Reference</span>
                <strong>JOB-{String(summary.jobId).padStart(4, '0')}</strong>
              </div>
              <div>
                <span>Service Title</span>
                <strong>{summary.jobTitle || 'Electrical Service'}</strong>
              </div>
              <div>
                <span>Assigned Electrician</span>
                <strong>{summary.electricianName || 'Pending Assignment'}</strong>
              </div>
              <div>
                <span>Job Lifecycle Status</span>
                <strong style={{ color: '#2563eb' }}>{summary.jobStatus}</strong>
              </div>
            </div>

            {/* Ineligibility Alert */}
            {!summary.isPaymentEligible && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#991b1b',
                  fontSize: '13px',
                }}
              >
                <strong>⚠️ Checkout Ineligible:</strong> {summary.ineligibilityReason}
              </div>
            )}

            {/* Authoritative Agreed Labour Charge */}
            <div className="checkout-cost-row">
              <span>Authoritative Labour Charge</span>
              <strong>
                {summary.labourCharge != null
                  ? `LKR ${Number(summary.labourCharge).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Pending Admin Quote'}
              </strong>
            </div>

            {/* Billable Equipment Total */}
            <div className="checkout-cost-row">
              <span>Billable Equipment (Approved)</span>
              <strong>
                LKR {Number(summary.billableEquipmentTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>

            {/* Equipment Breakdown List if items exist */}
            {summary.equipmentItems && summary.equipmentItems.length > 0 && (
              <div style={{ padding: '10px 0', fontSize: '13px', color: '#64748b' }}>
                <span style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                  Equipment Claims Breakdown:
                </span>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {summary.equipmentItems.map((item) => (
                    <li key={item.id} style={{ marginBottom: '4px' }}>
                      {item.itemName} (x{item.quantity}) — LKR {Number(item.totalPrice).toFixed(2)}{' '}
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.status === 'AdminApproved' || item.status === 'AutoApproved' ? '#dcfce7' : '#f1f5f9',
                          color: item.status === 'AdminApproved' || item.status === 'AutoApproved' ? '#166534' : '#475569',
                        }}
                      >
                        {item.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Platform Commission breakdown info */}
            <div className="checkout-cost-row" style={{ fontSize: '13px', color: '#64748b' }}>
              <span>Platform Commission ({summary.platformCommissionRate * 100}%)</span>
              <strong>LKR {Number(summary.platformCommission).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="checkout-cost-row" style={{ fontSize: '13px', color: '#64748b' }}>
              <span>Technician Share ({(1 - summary.platformCommissionRate) * 100}%)</span>
              <strong>LKR {Number(summary.electricianEarnings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            {/* Total GMV */}
            <div className="checkout-total">
              <span>Total Job Value (GMV)</span>
              <strong>
                LKR {Number(summary.grossJobValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </strong>
            </div>
          </section>

          {/* Right Column: Payment Method Selection & Checkout Action */}
          <section className="checkout-card">
            <h2>Select Payment Method</h2>

            <div className="payment-methods">
              {/* FullDigital Option */}
              <label
                className={`payment-method ${paymentMethod === 'Card' ? 'selected' : ''}`}
                style={{ cursor: paymentStatus === 'Pending' ? 'pointer' : 'default' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Card"
                  checked={paymentMethod === 'Card'}
                  onChange={() => setPaymentMethod('Card')}
                  disabled={paymentStatus !== 'Pending' || submitting}
                />
                <div style={{ flex: 1 }}>
                  <strong>Digital Payment (Card / LankaQR)</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Pay 100% (LKR {Number(summary.pricingOptions.fullDigital.customerPaysOnline).toLocaleString()}) online. Technician receives 85% directly in their ElectroSL wallet.
                  </p>
                </div>
              </label>

              {/* CashSplit Option */}
              <label
                className={`payment-method ${paymentMethod === 'Cash' ? 'selected' : ''}`}
                style={{ cursor: paymentStatus === 'Pending' ? 'pointer' : 'default' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={paymentMethod === 'Cash'}
                  onChange={() => setPaymentMethod('Cash')}
                  disabled={paymentStatus !== 'Pending' || submitting}
                />
                <div style={{ flex: 1 }}>
                  <strong>Cash on Delivery (CashSplit)</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Pay 15% platform fee (LKR {Number(summary.pricingOptions.cashSplit.customerPaysOnline).toLocaleString()}) online now. Pay the remaining 85% (LKR {Number(summary.pricingOptions.cashSplit.customerPaysCash).toLocaleString()}) directly to the technician in cash upon work completion.
                  </p>
                </div>
              </label>
            </div>

            {/* Breakdown Notice for Selected Method */}
            {selectedTier && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span>Online Payment Required Now:</span>
                  <strong style={{ color: '#102b50' }}>
                    LKR {Number(selectedTier.customerPaysOnline).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </strong>
                </div>
                {paymentMethod === 'Cash' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#047857' }}>
                    <span>Direct Cash to Technician upon Completion:</span>
                    <strong>
                      LKR {Number(selectedTier.customerPaysCash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                )}
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                  {paymentMethod === 'Cash'
                    ? '✓ No technician wallet debit or future commission debt is created.'
                    : '✓ Technician earnings credited atomically to wallet upon successful payment.'}
                </p>
              </div>
            )}

            {/* Status Display */}
            <div className="payment-status">
              <span>Payment Status</span>
              <strong style={{ color: paymentStatus === 'Payment Successful' ? '#166534' : '#b45309' }}>
                {paymentStatus}
              </strong>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ color: '#b91c1c', marginTop: '12px', fontSize: '13px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Success Receipt Details */}
            {receipt && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '16px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  fontSize: '13px',
                }}
              >
                <div style={{ color: '#166534', fontWeight: 'bold', marginBottom: '8px' }}>
                  ✅ Payment Confirmed (Tx #{receipt.transactionId})
                </div>
                <div>Amount Paid Online: <strong>LKR {Number(receipt.customerPaidOnline).toFixed(2)}</strong></div>
                {receipt.paymentMethod === 'CashSplit' && (
                  <div style={{ color: '#047857', marginTop: '4px' }}>
                    Cash Payable to Electrician: <strong>LKR {Number(receipt.customerDirectCash).toFixed(2)}</strong>
                  </div>
                )}
                <div style={{ color: '#64748b', fontSize: '11px', marginTop: '6px' }}>
                  Job lifecycle status: <strong>{receipt.jobStatus}</strong> (Status preserved, not marked completed).
                </div>
              </div>
            )}

            {message && !receipt && (
              <div className="checkout-message">
                {message}
              </div>
            )}

            {/* Pay Button */}
            {paymentStatus === 'Pending' && (
              <button
                type="button"
                className="checkout-pay-button"
                disabled={submitting || !summary.isPaymentEligible}
                style={{
                  opacity: submitting || !summary.isPaymentEligible ? 0.6 : 1,
                  cursor: submitting || !summary.isPaymentEligible ? 'not-allowed' : 'pointer',
                }}
                onClick={handlePayment}
              >
                {submitting
                  ? 'Processing Payment...'
                  : paymentMethod === 'Cash'
                  ? `Pay Platform Fee LKR ${Number(summary.pricingOptions.cashSplit.customerPaysOnline).toLocaleString()}`
                  : `Pay Full Amount LKR ${Number(summary.pricingOptions.fullDigital.customerPaysOnline).toLocaleString()}`}
              </button>
            )}

            <p className="payment-security-note">
              Payments are calculated and verified server-side. Amounts are computed exclusively from administrator-established labour charges and approved equipment claims.
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
