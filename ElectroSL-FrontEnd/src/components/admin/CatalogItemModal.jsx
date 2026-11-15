import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';

const CatalogItemModal = ({ isOpen, onClose, onSave, item, isSubmitting }) => {
  const [formData, setFormData] = useState({
    category: '',
    brandName: '',
    specification: '',
    standardMarketPrice: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (item) {
      setFormData({
        category: item.category || '',
        brandName: item.brandName || '',
        specification: item.specification || '',
        standardMarketPrice: item.standardMarketPrice || ''
      });
    } else {
      setFormData({
        category: '',
        brandName: '',
        specification: '',
        standardMarketPrice: ''
      });
    }
    setErrors({});
  }, [item, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.category.trim()) errs.category = 'Category is required.';
    if (!formData.brandName.trim()) errs.brandName = 'Brand name is required.';
    if (!formData.specification.trim()) errs.specification = 'Specification is required.';
    const price = parseFloat(formData.standardMarketPrice);
    if (isNaN(price) || price <= 0) errs.standardMarketPrice = 'Valid price greater than 0 is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      category: formData.category.trim(),
      brandName: formData.brandName.trim(),
      specification: formData.specification.trim(),
      standardMarketPrice: parseFloat(formData.standardMarketPrice)
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Equipment Baseline Price' : 'Add New Equipment to Catalog'}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
            Category *
          </label>
          <input
            type="text"
            placeholder="e.g. Cables & Wiring, Switches, MCB Breakers"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: errors.category ? '1px solid #ef4444' : '1px solid #d1d5db',
              boxSizing: 'border-box'
            }}
          />
          {errors.category && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>{errors.category}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
            Brand Name *
          </label>
          <input
            type="text"
            placeholder="e.g. ACL, Kelani, Orange, Schneider"
            value={formData.brandName}
            onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: errors.brandName ? '1px solid #ef4444' : '1px solid #d1d5db',
              boxSizing: 'border-box'
            }}
          />
          {errors.brandName && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>{errors.brandName}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
            Specification *
          </label>
          <input
            type="text"
            placeholder="e.g. 1.5mm Cu Wire 100m, 16A Single Pole MCB"
            value={formData.specification}
            onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: errors.specification ? '1px solid #ef4444' : '1px solid #d1d5db',
              boxSizing: 'border-box'
            }}
          />
          {errors.specification && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>{errors.specification}</p>}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.25rem' }}>
            Standard Baseline Market Price (LKR) *
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 8500.00"
            value={formData.standardMarketPrice}
            onChange={(e) => setFormData({ ...formData, standardMarketPrice: e.target.value })}
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: errors.standardMarketPrice ? '1px solid #ef4444' : '1px solid #d1d5db',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.2rem 0 0 0' }}>
            Electrician material bills are verified against this price (±5% allowable variance).
          </p>
          {errors.standardMarketPrice && (
            <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '0.2rem 0 0 0' }}>{errors.standardMarketPrice}</p>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              borderRadius: '0.375rem',
              border: 'none',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Saving...' : item ? 'Update Price' : 'Add Item'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CatalogItemModal;

