import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import CatalogItemModal from '../../components/admin/CatalogItemModal';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';

const EquipmentPriceCatalog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal
  const [modalState, setModalState] = useState({ isOpen: false, item: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getCatalogItems(selectedCategory, search);
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load equipment catalog:', err);
      setError('Unable to load equipment price catalog. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleSaveItem = async (itemData) => {
    try {
      setIsSubmitting(true);
      if (modalState.item) {
        // Update
        await adminService.updateCatalogItem(modalState.item.itemId, itemData);
        setFeedback({ type: 'success', text: `Equipment ${itemData.brandName} ${itemData.specification} updated.` });
      } else {
        // Create
        await adminService.createCatalogItem(itemData);
        setFeedback({ type: 'success', text: `New equipment added to catalog successfully.` });
      }
      setModalState({ isOpen: false, item: null });
      fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.brandName} - ${item.specification}" from the catalog?`)) {
      return;
    }

    try {
      await adminService.deleteCatalogItem(item.itemId);
      setFeedback({ type: 'success', text: `Item removed from catalog.` });
      fetchItems();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete item.' });
    }
  };

  // Derive available categories
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Equipment Price Control Catalog
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Maintain benchmark market prices. Electricians submitting equipment bills cannot exceed standard prices by &gt; 5%.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setModalState({ isOpen: true, item: null })}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>➕</span> Add New Equipment
          </button>
        </div>
      </div>

      {/* Alerts */}
      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '0.375rem',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            fontSize: '0.875rem'
          }}
        >
          {feedback.text}
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem', color: '#991b1b', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* 5% Rule Explanation Card */}
      <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🛡️</span>
        <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
          <strong>Sri Lanka Fair Pricing Compliance: </strong>
          Each standard market price forms the central baseline. The system automatically enforces an allowable threshold of 
          <strong> -5% to +5%</strong> on electrician material invoices. Any bill item with variance &gt; +5% will require customer re-authorization.
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search by brand name or specification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Search
          </button>
        </form>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: '0.375rem',
            border: '1px solid #cbd5e1',
            fontSize: '0.875rem',
            minWidth: '180px'
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Catalog Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
              <th style={{ padding: '0.75rem 1rem' }}>ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Category</th>
              <th style={{ padding: '0.75rem 1rem' }}>Brand</th>
              <th style={{ padding: '0.75rem 1rem' }}>Specification</th>
              <th style={{ padding: '0.75rem 1rem' }}>Baseline Price (LKR)</th>
              <th style={{ padding: '0.75rem 1rem' }}>±5% Allowable Band</th>
              <th style={{ padding: '0.75rem 1rem' }}>Last Updated</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Loading equipment catalog...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  No equipment catalog items found. Click "Add New Equipment" to register baseline prices.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const minPrice = item.standardMarketPrice * 0.95;
                const maxPrice = item.standardMarketPrice * 1.05;

                return (
                  <tr key={item.itemId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem' }}>
                      #{item.itemId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#334155', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1e293b' }}>
                      {item.brandName}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                      {item.specification}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                      {formatCurrency(item.standardMarketPrice)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.75rem' }}>
                      {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                      {formatDateTime(item.lastUpdated)}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setModalState({ isOpen: true, item })}
                          style={{
                            padding: '0.35rem 0.65rem',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            backgroundColor: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <CatalogItemModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, item: null })}
        onSave={handleSaveItem}
        item={modalState.item}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default EquipmentPriceCatalog;

