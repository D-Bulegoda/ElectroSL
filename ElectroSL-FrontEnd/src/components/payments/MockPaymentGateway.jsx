import React, { useState } from 'react';

const MockPaymentGateway = ({ amount, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    setLoading(true);
    // Simulate API delay for mock payment processing
    setTimeout(() => {
      setLoading(false);
      alert('Mock Payment Successful!');
      if (onPaymentSuccess) onPaymentSuccess('TXN_MOCK_123456');
    }, 2000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Secure Payment (Sandbox)</h2>
      <div className="text-2xl font-bold text-green-600 mb-6">LKR {amount.toFixed(2)}</div>
      
      <div className="space-y-4 mb-6">
        <input type="text" placeholder="Card Number (4242 4242 4242 4242)" className="w-full border p-2 rounded" />
        <div className="flex space-x-4">
          <input type="text" placeholder="MM/YY" className="w-1/2 border p-2 rounded" />
          <input type="text" placeholder="CVC" className="w-1/2 border p-2 rounded" />
        </div>
      </div>

      <button 
        onClick={handlePay}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-bold ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
};

export default MockPaymentGateway;