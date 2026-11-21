import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import adminService from '../../services/adminService';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';

const PriceHistoryModal = ({ isOpen, onClose, item }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && item) {
      loadHistory();
    } else {
      setHistory([]);
      setError(null);
    }
  }, [isOpen, item]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getCatalogPriceHistory(item.itemId);
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load price history:', err);
      setError(err.message || 'Unable to load historical price audit records.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Price History: ${item.itemName || item.brandName}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Item Summary Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '4px'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
              Item #{item.itemId} &bull; {item.category}
            </div>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.875rem' }}>
              {item.brandName} - {item.specification}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.6875rem', color: '#64748b', display: 'block' }}>Current Benchmark</span>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>
              {formatCurrency(item.standardMarketPrice)}
            </strong>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.8125rem' }}>
            {error}
          </div>
        )}

        {/* Table or States */}
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
            Loading price change history...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🏷️</div>
            <p style={{ fontWeight: 600, color: '#64748b', margin: '0 0 0.25rem 0' }}>No Price Modifications Recorded</p>
            <p style={{ fontSize: '0.75rem', margin: 0 }}>This equipment item remains at its initial baseline price.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Effective Date</th>
                  <th>Old Price</th>
                  <th>New Price</th>
                  <th>% Change</th>
                  <th>Modified By</th>
                  <th>Audit Justification</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => {
                  const pct = record.changePercentage;
                  const isPositive = pct > 0;
                  return (
                    <tr key={record.id}>
                      <td style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDateTime(record.effectiveDateUtc)}
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {formatCurrency(record.oldPrice)}
                      </td>
                      <td style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                        {formatCurrency(record.newPrice)}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '3px',
                            backgroundColor: isPositive ? '#fee2e2' : '#ecfdf5',
                            color: isPositive ? '#991b1b' : '#047857'
                          }}
                        >
                          {isPositive ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#475569' }}>
                        Admin #{record.changedByAdminId}
                      </td>
                      <td style={{ fontSize: '0.75rem', color: record.reason ? '#1e293b' : '#94a3b8' }}>
                        {record.reason || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PriceHistoryModal;

