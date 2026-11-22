import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../services/api';

const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `LKR ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function WalletAndEarnings() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setLoading(true);
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const userId = user.userId || user.id;
        if (!userId) return;

        const data = await fetchWithAuth(`/ElectricianProfile/${userId}/wallet`);
        setWallet(data);
      } catch (err) {
        console.error('Failed to load wallet data:', err);
        setError(err.message || 'Failed to load wallet details.');
      } finally {
        setLoading(false);
      }
    };

    loadWallet();
  }, []);

  const currentBalance = wallet ? wallet.currentWalletBalance : 0;
  const commissionDebt = wallet ? wallet.outstandingCommissionDebt : 0;
  const availablePayout = wallet ? wallet.availablePayoutBalance : 0;
  const transactions = wallet?.transactions || [];

  return (
    <div className="wallet-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <h1>Wallet & Earnings</h1>
      <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
        Track your service income, commission debits, and withdrawable funds.
      </p>

      {/* Debt and Automatic Recovery Notice */}
      <div
        style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: commissionDebt > 0 ? '#fffbeb' : '#f0fdf4',
          border: `1px solid ${commissionDebt > 0 ? '#fde68a' : '#bbf7d0'}`,
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: commissionDebt > 0 ? '#92400e' : '#166534',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
          {commissionDebt > 0 ? '⚠️ Outstanding Platform Commission Notice' : '✅ Wallet & Commission Status Normal'}
        </div>
        <div>
          {commissionDebt > 0
            ? `You have ${formatCurrency(commissionDebt)} in outstanding platform commission from cash-paid jobs. Subsequent online job earnings will automatically recover this debt before payout withdrawals can be processed.`
            : 'For cash-paid jobs, the 15% platform commission is debited to your wallet. For online card payments, your 85% earnings are credited to your wallet.'}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="wallet-summary" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="wallet-card" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Wallet Balance</h3>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: currentBalance < 0 ? '#dc2626' : '#0f172a', margin: 0 }}>
            {formatCurrency(currentBalance)}
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Net virtual ledger balance</span>
        </div>

        <div className="wallet-card" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Outstanding Commission Debt</h3>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: commissionDebt > 0 ? '#dc2626' : '#16a34a', margin: 0 }}>
            {formatCurrency(commissionDebt)}
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Owed to platform from cash jobs</span>
        </div>

        <div className="wallet-card" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 0.5rem 0' }}>Available for Payout</h3>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: availablePayout > 0 ? '#16a34a' : '#94a3b8', margin: 0 }}>
            {commissionDebt > 0 ? 'LKR 0.00' : formatCurrency(availablePayout)}
          </h2>
          <span style={{ fontSize: '0.75rem', color: commissionDebt > 0 ? '#dc2626' : '#94a3b8' }}>
            {commissionDebt > 0 ? 'Locked until commission debt cleared' : 'Min. payout LKR 1,000.00'}
          </span>
        </div>
      </div>

      {/* Ledger History Table */}
      <section className="wallet-transactions">
        <h2 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Wallet Transaction Ledger</h2>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: '#f8fafc', borderRadius: '8px', color: '#64748b', border: '1px solid #e2e8f0' }}>
            {loading ? 'Loading wallet transactions...' : 'No wallet transactions recorded yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', textAlign: 'left', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '0.75rem' }}>Txn ID</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Job ID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Balance After</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debt Recovered</th>
                  <th style={{ padding: '0.75rem' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.transactionId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>#{tx.transactionId}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: tx.amount >= 0 ? '#dcfce7' : '#fee2e2',
                          color: tx.amount >= 0 ? '#166534' : '#991b1b',
                        }}
                      >
                        {tx.transactionType}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{tx.jobId ? `Job #${tx.jobId}` : '—'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: tx.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                      {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>
                      {formatCurrency(tx.balanceAfter)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: tx.commissionDebtRecovered > 0 ? '#16a34a' : '#94a3b8' }}>
                      {tx.commissionDebtRecovered > 0 ? formatCurrency(tx.commissionDebtRecovered) : '—'}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#475569', fontSize: '0.8rem' }}>{tx.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
