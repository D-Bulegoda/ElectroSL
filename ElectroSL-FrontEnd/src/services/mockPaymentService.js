import React, { useState } from 'react';

export const MockPaymentGateway = ({ totalAmount, jobId }) => {
  const [loading, setLoading] = useState(false);
  const platformFee = totalAmount * 0.15;
  const electricianEarnings = totalAmount - platformFee;

  const handlePayment = async () => {
    setLoading(true);
    // Simulate API transaction call
    setTimeout(() => {
      alert(`Payment of LKR ${totalAmount} processed successfully!`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl text-white max-w-md">
      <h3 className="text-lg font-bold mb-4">Secure Payment Gateway</h3>
      <div className="space-y-2 mb-4 text-sm text-slate-300">
        <p>Total Job Amount: LKR {totalAmount.toFixed(2)}</p>
        <p className="text-emerald-400">Electrician Earnings (85%): LKR {electricianEarnings.toFixed(2)}</p>
        <p className="text-amber-400">Platform Commission (15%): LKR {platformFee.toFixed(2)}</p>
      </div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-medium transition"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
};