import React, { useState } from "react";

const API_BASE = "http://localhost:5192";

export default function MockPaymentGateway({ jobId = 1, defaultAmount = 5000, onSuccess }) {
  const [totalAmount, setTotalAmount] = useState(defaultAmount);
  const [paymentMethod, setPaymentMethod] = useState("Visa");
  const [cardNumber, setCardNumber] = useState("4532 1100 2299 8844");
  const [expiry, setExpiry] = useState("12/28");
  const [cvv, setCvv] = useState("123");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);

  const handlePayment = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/MockPayment/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: Number(jobId),
          totalAmount: Number(totalAmount),
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Payment failed.");
      } else {
        setReceipt(data);
        if (onSuccess) onSuccess(data);
      }
    } catch (err) {
      setError("Could not connect to the payment server.");
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <div
        style={{
          maxWidth: "420px",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid #bbf7d0",
          background: "#f0fdf4",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", color: "#166534" }}>
          ✅ Payment Successful
        </h3>
        <p style={{ margin: "6px 0" }}>
          <strong>Transaction ID:</strong> #{receipt.transactionId}
        </p>
        <p style={{ margin: "6px 0" }}>
          <strong>Platform Commission (10%):</strong> LKR{" "}
          {Number(receipt.platformCommission).toFixed(2)}
        </p>
        <p style={{ margin: "6px 0" }}>
          <strong>Electrician Earning:</strong> LKR{" "}
          {Number(receipt.electricianEarning).toFixed(2)}
        </p>
        <p style={{ margin: "6px 0" }}>
          <strong>Updated Wallet Balance:</strong> LKR{" "}
          {Number(receipt.newWalletBalance ?? 0).toFixed(2)}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handlePayment}
      style={{
        maxWidth: "420px",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
      }}
    >
      <h3 style={{ marginTop: 0 }}>ElectroSL Mock Payment</h3>
      <p style={{ fontSize: "13px", color: "#64748b", marginTop: "-8px" }}>
        Job #{jobId} Checkout
      </p>

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
          {error}
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>
          Amount (LKR)
        </label>
        <input
          type="number"
          step="0.01"
          min="1"
          required
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>
          Payment Method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
        >
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
          <option value="LankaQR">LankaQR</option>
          <option value="Cash">Cash</option>
        </select>
      </div>

      {(paymentMethod === "Visa" || paymentMethod === "Mastercard") && (
        <>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600" }}>
              Card Number (Mock)
            </label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
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
                style={{ width: "100%", padding: "8px", marginTop: "4px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
            </div>
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "none",
          background: loading ? "#94a3b8" : "#2563eb",
          color: "#fff",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Processing..." : `Pay LKR ${Number(totalAmount || 0).toFixed(2)}`}
      </button>
    </form>
  );
}