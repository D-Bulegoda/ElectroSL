import React, { useState } from 'react';

export const MockPaymentGateway = ({ jobId, totalAmount, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const platformFee = totalAmount * 0.15;
  const electricianEarnings = totalAmount - platformFee;

  const handleProcessPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5192/api/MockPayment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          totalAmount: totalAmount,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Payment Successful! Transaction ID: ${data.transactionId}\nElectrician Earned: LKR ${data.earning.toFixed(2)}`);
        if (onPaymentSuccess) onPaymentSuccess(data);
      } else {
        alert('Payment processing failed on server.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Network error connecting to payment gateway backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl text-white max-w-md shadow-xl">
      <h3 className="text-xl font-bold mb-3 text-amber-400">💳 ElectroSL Secure Checkout</h3>
      <p className="text-sm text-slate-400 mb-4">Job ID: #{jobId}</p>

      <div className="bg-slate-800 p-4 rounded-lg space-y-2 mb-6 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-300">Total Job Cost:</span>
          <span className="font-bold text-white">LKR {totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300">Electrician Share (85%):</span>
          <span className="text-emerald-400 font-semibold">LKR {electricianEarnings.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-2">
          <span className="text-slate-300">Platform Commission (15%):</span>
          <span className="text-amber-400 font-semibold">LKR {platformFee.toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={handleProcessPayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition duration-200 shadow-lg disabled:opacity-50"
      >
        {loading ? 'Processing Split Payment...' : `Pay LKR ${totalAmount.toFixed(2)} Now`}
      </button>
    </div>
  );
};