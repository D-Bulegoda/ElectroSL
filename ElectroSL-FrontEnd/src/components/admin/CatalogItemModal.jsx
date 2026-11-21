import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const CatalogItemModal = ({ isOpen, onClose, onSave, item, isSubmitting }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    brandName: '',
    specification: '',
    unit: 'Unit',
    description: '',
    standardMarketPrice: '',
    priceVarianceThreshold: '5.00',
    isActive: true,
    reason: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        itemName: item.itemName || '',
        category: item.category || '',
        brandName: item.brandName || '',
        specification: item.specification || '',
        unit: item.unit || 'Unit',
        description: item.description || '',
        standardMarketPrice: item.standardMarketPrice !== undefined ? String(item.standardMarketPrice) : '',
        priceVarianceThreshold: item.priceVarianceThreshold !== undefined ? String(item.priceVarianceThreshold) : '5.00',
        isActive: item.isActive !== undefined ? item.isActive : true,
        reason: ''
      });
    } else {
      setFormData({
        itemName: '',
        category: '',
        brandName: '',
        specification: '',
        unit: 'Unit',
        description: '',
        standardMarketPrice: '',
        priceVarianceThreshold: '5.00',
        isActive: true,
        reason: ''
      });
    }
    setErrors({});
  }, [item, isOpen]);

  if (!isOpen) return null;

  // Auto-fill ItemName if blank when Brand or Specification change
  const handleBrandChange = (val) => {
    setFormData((prev) => {
      const next = { ...prev, brandName: val };
      if (!item && (!prev.itemName || prev.itemName === `${prev.brandName} ${prev.specification}`.trim())) {
        next.itemName = `${val} ${prev.specification}`.trim();
      }
      return next;
    });
  };

  const handleSpecChange = (val) => {
    setFormData((prev) => {
      const next = { ...prev, specification: val };
      if (!item && (!prev.itemName || prev.itemName === `${prev.brandName} ${prev.specification}`.trim())) {
        next.itemName = `${prev.brandName} ${val}`.trim();
      }
      return next;
    });
  };

  // Calculate price difference for existing items
  const newPriceNum = parseFloat(formData.standardMarketPrice);
  const oldPriceNum = item ? parseFloat(item.standardMarketPrice) : null;
  const isPriceChanged = item && !isNaN(newPriceNum) && !isNaN(oldPriceNum) && newPriceNum !== oldPriceNum && oldPriceNum > 0;
  const percentageChange = isPriceChanged ? Math.round(((newPriceNum - oldPriceNum) / oldPriceNum) * 10000) / 100 : 0;
  const isSignificantChange = isPriceChanged && Math.abs(percentageChange) >= 25.0;

  const validate = () => {
    const errs = {};
    if (!formData.itemName.trim()) errs.itemName = 'Equipment item name is required.';
    if (!formData.category.trim()) errs.category = 'Category is required.';
    if (!formData.brandName.trim()) errs.brandName = 'Brand name is required.';
    if (!formData.specification.trim()) errs.specification = 'Specification is required.';
    if (!formData.unit.trim()) errs.unit = 'Unit of measurement is required.';

    const price = parseFloat(formData.standardMarketPrice);
    if (isNaN(price) || price <= 0) {
      errs.standardMarketPrice = 'A valid benchmark price greater than zero is required.';
    }

    const threshold = parseFloat(formData.priceVarianceThreshold);
    if (isNaN(threshold) || threshold <= 0 || threshold > 100) {
      errs.priceVarianceThreshold = 'Variance threshold must be between 0.01% and 100.00%.';
    }

    // Require reason if >= 25% price change
    if (isSignificantChange) {
      if (!formData.reason || formData.reason.trim().length < 10) {
        errs.reason = `A justification of at least 10 characters is mandatory for price changes of >= 25% (current: ${percentageChange > 0 ? '+' : ''}${percentageChange}%).`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      itemName: formData.itemName.trim(),
      category: formData.category.trim(),
      brandName: formData.brandName.trim(),
      specification: formData.specification.trim(),
      unit: formData.unit.trim(),
      description: formData.description.trim() ? formData.description.trim() : null,
      standardMarketPrice: parseFloat(formData.standardMarketPrice),
      priceVarianceThreshold: parseFloat(formData.priceVarianceThreshold),
      isActive: formData.isActive
    };

    if (item) {
      payload.concurrencyVersion = item.concurrencyVersion;
      if (formData.reason && formData.reason.trim()) {
        payload.reason = formData.reason.trim();
      }
    }

    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? `Edit Equipment Baseline: ${item.itemName || item.brandName}` : 'Add New Equipment to Baseline Catalog'}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '78vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
        
        {/* Item Name */}
        <div className="admin-form-group">
          <label className="admin-label">Item Name *</label>
          <input
            type="text"
            placeholder="e.g. ACL 1.5mm Copper Earth Wire 100m"
            value={formData.itemName}
            onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
            className="admin-input"
            style={{ borderColor: errors.itemName ? '#ef4444' : '#cbd5e1' }}
          />
          {errors.itemName && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.itemName}</p>}
        </div>

        {/* Row 1: Category & Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Category *</label>
            <input
              type="text"
              placeholder="e.g. Cables & Wiring, Circuit Breakers, Switches"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="admin-input"
              style={{ borderColor: errors.category ? '#ef4444' : '#cbd5e1' }}
            />
            {errors.category && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.category}</p>}
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Unit of Measure *</label>
            <input
              type="text"
              placeholder="e.g. Meter, Unit, Roll, Box"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="admin-input"
              style={{ borderColor: errors.unit ? '#ef4444' : '#cbd5e1' }}
            />
            {errors.unit && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.unit}</p>}
          </div>
        </div>

        {/* Row 2: Brand & Specification */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Brand Name *</label>
            <input
              type="text"
              placeholder="e.g. ACL, Kelani, Orange, Schneider"
              value={formData.brandName}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="admin-input"
              style={{ borderColor: errors.brandName ? '#ef4444' : '#cbd5e1' }}
            />
            {errors.brandName && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.brandName}</p>}
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Specification *</label>
            <input
              type="text"
              placeholder="e.g. 1.5mm Single Core 100m, 16A SP MCB"
              value={formData.specification}
              onChange={(e) => handleSpecChange(e.target.value)}
              className="admin-input"
              style={{ borderColor: errors.specification ? '#ef4444' : '#cbd5e1' }}
            />
            {errors.specification && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.specification}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="admin-form-group">
          <label className="admin-label">Description (Optional)</label>
          <textarea
            rows={2}
            placeholder="Technical details, standards compliance (e.g. SLS 733), or usage notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="admin-input"
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Row 3: Price & Variance Threshold */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
          <div className="admin-form-group">
            <label className="admin-label">Standard Baseline Price (LKR) *</label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 8500.00"
              value={formData.standardMarketPrice}
              onChange={(e) => setFormData({ ...formData, standardMarketPrice: e.target.value })}
              className="admin-input"
              style={{ borderColor: errors.standardMarketPrice ? '#ef4444' : '#cbd5e1' }}
            />
            {errors.standardMarketPrice && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.standardMarketPrice}</p>
            )}
          </div>

          <div className="admin-form-group">
            <label className="admin-label">Variance Threshold (%) *</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="100.0"
              placeholder="e.g. 5.0"
              value={formData.priceVarianceThreshold}
              onChange={(e) => setFormData({ ...formData, priceVarianceThreshold: e.target.value })}
              className="admin-input"
              style={{ borderColor: errors.priceVarianceThreshold ? '#ef4444' : '#cbd5e1' }}
            />
            <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
              Claims beyond ±{formData.priceVarianceThreshold || '5'}% are flagged.
            </span>
            {errors.priceVarianceThreshold && (
              <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.priceVarianceThreshold}</p>
            )}
          </div>
        </div>

        {/* Significant Price Change Warning & Reason */}
        {isPriceChanged && (
          <div
            style={{
              padding: '0.75rem 0.85rem',
              borderRadius: '4px',
              backgroundColor: isSignificantChange ? '#fef3c7' : '#f0fdf4',
              border: `1px solid ${isSignificantChange ? '#fde68a' : '#bbf7d0'}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSignificantChange ? '#92400e' : '#166534' }}>
                Price Modification: LKR {oldPriceNum.toFixed(2)} → LKR {newPriceNum.toFixed(2)}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '3px',
                  backgroundColor: percentageChange > 0 ? '#fee2e2' : '#ecfdf5',
                  color: percentageChange > 0 ? '#991b1b' : '#047857'
                }}
              >
                {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}
              </span>
            </div>

            {isSignificantChange && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <p style={{ fontSize: '0.6875rem', color: '#78350f', margin: 0 }}>
                  <strong>Significant Modification Notice (≥ 25%):</strong> Price changes of 25% or greater require an audit justification of at least 10 characters before submission.
                </p>
                <div className="admin-form-group" style={{ margin: 0 }}>
                  <label className="admin-label" style={{ color: '#92400e' }}>
                    Audit Justification / Reason *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="State market supplier revision, import tariff change, or raw material cost update..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="admin-input"
                    style={{ borderColor: errors.reason ? '#ef4444' : '#cbd5e1' }}
                  />
                  {errors.reason && (
                    <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.15rem 0 0 0' }}>{errors.reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <input
            type="checkbox"
            id="itemIsActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <label htmlFor="itemIsActive" style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            Active in Catalog (Electricians can select this baseline item for job invoices)
          </label>
        </div>

        {/* Concurrency Info */}
        {item && item.concurrencyVersion && (
          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textAlign: 'right' }}>
            Record Version: #{item.concurrencyVersion}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.85rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="admin-btn admin-btn-primary"
          >
            {isSubmitting ? 'Saving Baseline...' : item ? 'Update Baseline' : 'Add Equipment Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CatalogItemModal;
