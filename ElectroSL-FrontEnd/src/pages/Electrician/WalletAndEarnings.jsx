import React from 'react';

export default function WalletAndEarnings() {
  const transactions = [
    {
      id: 1,
      job: 'House Wiring Repair',
      date: '10 Nov 2026',
      amount: 2500,
      status: 'Completed',
    },
    {
      id: 2,
      job: 'Ceiling Fan Installation',
      date: '08 Nov 2026',
      amount: 1800,
      status: 'Completed',
    },
    {
      id: 3,
      job: 'Switch Replacement',
      date: '05 Nov 2026',
      amount: 1200,
      status: 'Pending',
    },
  ];

  return (
    <div className="wallet-page">
      <h1>Wallet & Earnings</h1>
      <p>Track your income and payment transactions.</p>

      <div className="wallet-summary">
        <div className="wallet-card">
          <h3>Total Earnings</h3>
          <h2>Rs. 5,500</h2>
        </div>

        <div className="wallet-card">
          <h3>Available Balance</h3>
          <h2>Rs. 4,300</h2>
        </div>

        <div className="wallet-card">
          <h3>Pending Payments</h3>
          <h2>Rs. 1,200</h2>
        </div>
      </div>

      <section className="wallet-transactions">
        <h2>Transaction History</h2>

        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{transaction.job}</td>
                <td>{transaction.date}</td>
                <td>Rs. {transaction.amount}</td>
                <td>
                  <span className={`payment-status ${transaction.status.toLowerCase()}`}>
                    {transaction.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}