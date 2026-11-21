import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import CatalogItemModal from '../../components/admin/CatalogItemModal';
import PriceHistoryModal from '../../components/admin/PriceHistoryModal';
import { formatCurrency, formatDateTime } from '../../utils/formattingHelpers';
import {
  SearchIcon,
  PlusIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
  HistoryIcon,
  CheckIcon
} from '../../components/admin/AdminIcons';

const EquipmentPriceCatalog = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState(''); // '' (all), 'true' (active), 'false' (inactive)

  // Modals
  const [editModalState, setEditModalState] = useState({ isOpen: false, item: null });
  const [historyModalState, setHistoryModalState] = useState({ isOpen: false, item: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const isActiveParam = activeFilter === 'true' ? true : activeFilter === 'false' ? false : null;
      const data = await adminService.getCatalogItems(selectedCategory, search, isActiveParam);
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load equipment catalog:', err);
      setError(err.message || 'Unable to load equipment price catalog. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, activeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleSaveItem = async (itemData) => {
    try {
      setIsSubmitting(true);
      if (editModalState.item) {
        await adminService.updateCatalogItem(editModalState.item.itemId, itemData);
        setFeedback({
          type: 'success',
          text: `Successfully updated "${itemData.itemName}".`
        });
      } else {
        await adminService.createCatalogItem(itemData);
        setFeedback({
          type: 'success',
          text: `Successfully added "${itemData.itemName}" to catalog baseline.`
        });
      }
      setEditModalState({ isOpen: false, item: null });
      fetchItems();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Operation failed.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivateItem = async (item) => {
    if (!window.confirm(`Deactivate "${item.itemName || item.brandName}"? Inactive items cannot be claimed for new customer jobs.`)) {
      return;
    }

    try {
      await adminService.deleteCatalogItem(item.itemId, item.concurrencyVersion);
      setFeedback({
        type: 'success',
        text: `Deactivated "${item.itemName || item.brandName}". Historical job relationships are preserved.`
      });
      fetchItems();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to deactivate item.'
      });
    }
  };

  const handleActivateItem = async (item) => {
    if (!window.confirm(`Reactivate "${item.itemName || item.brandName}"? This item will become available for electrician job invoices.`)) {
      return;
    }

    try {
      await adminService.activateCatalogItem(item.itemId, item.concurrencyVersion);
      setFeedback({
        type: 'success',
        text: `Activated "${item.itemName || item.brandName}". It is now available for job invoices.`
      });
      fetchItems();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to activate item.'
      });
    }
  };

  // Derive distinct categories for dropdown filter
  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1280px' }}>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 className="admin-page-title">Equipment Price Control Catalog</h1>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px'
              }}
            >
              {items.length} {activeFilter === 'true' ? 'Active' : activeFilter === 'false' ? 'Inactive' : 'Tracked'} Items
            </span>
          </div>
          <p className="admin-page-subtitle">
            Benchmark retail market prices for electrical materials. Technician invoice claims exceeding allowable threshold are automatically flagged for review.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={fetchItems}
            disabled={loading}
            className="admin-btn admin-btn-secondary"
          >
            <RefreshCwIcon size={14} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setEditModalState({ isOpen: true, item: null })}
            className="admin-btn admin-btn-primary"
          >
            <PlusIcon size={14} /> Add Equipment Item
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: '0.65rem 1rem',
            borderRadius: '4px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
            color: feedback.type === 'success' ? '#166534' : '#991b1b'
          }}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.65rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.8125rem' }}>
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '260px' }}>
          <div className="admin-search-box" style={{ flex: 1 }}>
            <span className="admin-search-icon">
              <SearchIcon size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by name, brand, or specification..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-secondary">
            Search
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="admin-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Status:</span>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="admin-select"
            style={{ width: 'auto', minWidth: '130px' }}
          >
            <option value="">All Items</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ID</th>
              <th>Equipment Item</th>
              <th>Category & Unit</th>
              <th>Standard Price</th>
              <th>Allowable Variance</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                  Loading equipment baseline catalog...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '3.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.35rem' }}>🔍</div>
                  <p style={{ fontWeight: 600, color: '#64748b', margin: '0 0 0.25rem 0' }}>No Catalog Items Found</p>
                  <p style={{ fontSize: '0.75rem', margin: 0 }}>Try clearing filters or search keywords, or add a new baseline item.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const basePrice = item.standardMarketPrice || 0;
                const threshold = item.priceVarianceThreshold !== undefined ? item.priceVarianceThreshold : 5.0;
                const minPrice = basePrice * (1 - threshold / 100);
                const maxPrice = basePrice * (1 + threshold / 100);
                const isActive = item.isActive !== false;

                return (
                  <tr key={item.itemId} style={{ opacity: isActive ? 1 : 0.65 }}>
                    <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem' }}>
                      #{item.itemId}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {item.itemName || `${item.brandName} ${item.specification}`}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {item.brandName} &bull; {item.specification}
                        {item.description ? ` &bull; ${item.description}` : ''}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 600,
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '3px',
                            display: 'inline-block'
                          }}
                        >
                          {item.category || 'General'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                        per {item.unit || 'Unit'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                        {formatCurrency(basePrice)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>
                        ±{threshold.toFixed(1)}%
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.6875rem' }}>
                        {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: isActive ? '#ecfdf5' : '#f1f5f9',
                          color: isActive ? '#065f46' : '#64748b',
                          border: `1px solid ${isActive ? '#a7f3d0' : '#cbd5e1'}`
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#10b981' : '#94a3b8'
                          }}
                        />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {formatDateTime(item.lastUpdated)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setHistoryModalState({ isOpen: true, item })}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="View price modification history"
                        >
                          <HistoryIcon size={13} /> History
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditModalState({ isOpen: true, item })}
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          title="Edit baseline item or price"
                        >
                          <EditIcon size={12} /> Edit
                        </button>
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => handleDeactivateItem(item)}
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            title="Deactivate item (preserves historical references)"
                          >
                            <TrashIcon size={12} /> Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivateItem(item)}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            title="Reactivate item for job invoices"
                          >
                            <CheckIcon size={12} /> Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Catalog Item Create / Edit Modal */}
      <CatalogItemModal
        isOpen={editModalState.isOpen}
        item={editModalState.item}
        onClose={() => setEditModalState({ isOpen: false, item: null })}
        onSave={handleSaveItem}
        isSubmitting={isSubmitting}
      />

      {/* Price History Modal */}
      <PriceHistoryModal
        isOpen={historyModalState.isOpen}
        item={historyModalState.item}
        onClose={() => setHistoryModalState({ isOpen: false, item: null })}
      />
    </div>
  );
};

export default EquipmentPriceCatalog;
