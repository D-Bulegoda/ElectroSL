import React, { useState, useEffect } from "react";
import { getCheckoutSummary, processPayment } from "../../services/mockPaymentService";

export default function MockPaymentGateway({ jobId = 1, onSuccess }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("FullDigital");
  const [cardNumber, setCardNumber] = useState("4532 1100 2299 8844");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    loadSummary();
  }, [jobId]);

  const loadSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCheckoutSummary(jobId);
      setSummary(data);
      if (!data.isPaymentEligible) {
        setError(data.ineligibilityReason || "Job is not eligible for payment.");
      }
    } catch (err) {
      setError(err.message || "Failed to load authoritative checkout summary.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setError("");

    if (!summary || !summary.isPaymentEligible) {
      setError("Payment cannot proceed: Job is not eligible for checkout.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await processPayment({
        jobId: Number(jobId),
        paymentMethod,
      });

      setReceipt(result);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || "Payment processing failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <div
        style={{
          maxWidth: "440px",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", color: "#166534" }}>
          ✅ Payment Successful
        </h3>
        <p style={{ margin: "6px 0", fontSize: "14px" }}>
          <strong>Transaction ID:</strong> #{receipt.transactionId}
        </p>
        <p style={{ margin: "6px 0", fontSize: "14px" }}>
          <strong>Payment Method:</strong> {receipt.paymentMethod}
        </p>
        <p style={{ margin: "6px 0", fontSize: "14px" }}>
          <strong>Gross Job Value:</strong> LKR {Number(receipt.grossJobValue).toFixed(2)}
        </p>
        <p style={{ margin: "6px 0", fontSize: "14px" }}>
          <strong>Amount Paid Online:</strong> LKR {Number(receipt.customerPaidOnline).toFixed(2)}
        </p>
        {receipt.paymentMethod === "CashSplit" ? (
          <p style={{ margin: "6px 0", fontSize: "14px", color: "#047857" }}>
            <strong>Direct Cash to Electrician:</strong> LKR {Number(receipt.customerDirectCash).toFixed(2)} (No wallet deduction or debt)
          </p>
        ) : (
          <p style={{ margin: "6px 0", fontSize: "14px", color: "#047857" }}>
            <strong>Electrician Wallet Credit (85%):</strong> LKR {Number(receipt.electricianEarnings).toFixed(2)}
          </p>
        )}
        {receipt.updatedWalletBalance != null && (
          <p style={{ margin: "6px 0", fontSize: "14px" }}>
            <strong>Updated Electrician Wallet Balance:</strong> LKR {Number(receipt.updatedWalletBalance).toFixed(2)}
          </p>
        )}
        <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: "#64748b" }}>
          Job status: <strong>{receipt.jobStatus}</strong> (Status preserved, not marked completed).
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handlePayment}
      style={{
        maxWidth: "440px",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>ElectroSL Secure Checkout</h3>
      <p style={{ fontSize: "13px", color: "#64748b", marginTop: "-8px" }}>
        Authoritative Job #{jobId} Settlement
      </p>

      {loading ? (
        <p style={{ fontSize: "13px", color: "#64748b" }}>Loading server checkout details...</p>
      ) : summary ? (
        <div
          style={{
            background: "#f8fafc",
            padding: "12px 14px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "13px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>Agreed Labour Charge:</span>
            <strong>
              {summary.labourCharge != null ? `LKR ${Number(summary.labourCharge).toFixed(2)}` : "Pending Admin Quote"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>Billable Equipment:</span>
            <strong>LKR {Number(summary.billableEquipmentTotal).toFixed(2)}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              borderTop: "1px solid #cbd5e1",
              paddingTop: "6px",
              marginTop: "4px",
              color: "#1e293b",
            }}
          >
            <span>Total GMV:</span>
            <span>LKR {Number(summary.grossJobValue).toFixed(2)}</span>
          </div>
        </div>
      ) : null}

      {error && (
        <div
          style={{
            padding: "10px",
            marginBottom: "12px",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "13px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Payment Method Selector */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
          Select Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={submitting || (summary && !summary.isPaymentEligible)}
          style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="FullDigital">FullDigital (Card / 100% Online)</option>
          <option value="CashSplit">CashSplit (15% Online Platform Fee + 85% Cash on-site)</option>
        </select>
      </div>

      {paymentMethod === "FullDigital" && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>
              Card Number (Simulation)
            </label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              disabled={submitting}
              style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>
                Expiry
              </label>
              <input
                type="text"
                required
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                disabled={submitting}
                style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>
                CVV
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                disabled={submitting}
                style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        </>
      )}

      {paymentMethod === "CashSplit" && summary && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "6px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            marginBottom: "16px",
            fontSize: "12px",
            color: "#1e40af",
          }}
        >
          <strong>CashSplit Breakdown:</strong>
          <br />
          • Pay 15% platform commission (LKR {Number(summary.pricingOptions.cashSplit.customerPaysOnline).toFixed(2)}) online now.
          <br />
          • Pay 85% (LKR {Number(summary.pricingOptions.cashSplit.customerPaysCash).toFixed(2)}) directly to electrician in cash.
          <br />
          • Zero wallet deduction or debt.
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || loading || !summary?.isPaymentEligible}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          background: submitting || !summary?.isPaymentEligible ? "#94a3b8" : "#2563eb",
          color: "#fff",
          fontWeight: "600",
          cursor: submitting || !summary?.isPaymentEligible ? "not-allowed" : "pointer",
        }}
      >
        {submitting
          ? "Processing..."
          : paymentMethod === "CashSplit"
          ? `Pay Platform Fee (LKR ${Number(summary?.pricingOptions?.cashSplit?.customerPaysOnline || 0).toFixed(2)})`
          : `Pay Online (LKR ${Number(summary?.grossJobValue || 0).toFixed(2)})`}
      </button>
    </form>
  );
}
