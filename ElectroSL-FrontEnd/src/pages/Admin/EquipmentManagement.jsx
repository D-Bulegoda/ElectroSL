import React, { useState } from 'react';
import EquipmentPriceCatalog from './EquipmentPriceCatalog';
import FlaggedEquipmentClaims from './FlaggedEquipmentClaims';
import { TagIcon, ShieldAlertIcon } from '../../components/admin/AdminIcons';

export default function EquipmentManagement({ defaultTab = 'catalog' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'catalog' | 'claims'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1360px', margin: '0 auto' }}>
      {/* Top Header & Unified Tab Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0.5rem'
        }}
      >
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'catalog' ? 700 : 500,
              color: activeTab === 'catalog' ? '#2563eb' : '#64748b',
              backgroundColor: activeTab === 'catalog' ? '#eff6ff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'catalog' ? '2px solid #2563eb' : '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-0.5rem'
            }}
          >
            <TagIcon size={16} />
            <span>Equipment Catalog & Price Control</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('claims')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'claims' ? 700 : 500,
              color: activeTab === 'claims' ? '#2563eb' : '#64748b',
              backgroundColor: activeTab === 'claims' ? '#eff6ff' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'claims' ? '2px solid #2563eb' : '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              marginBottom: '-0.5rem'
            }}
          >
            <ShieldAlertIcon size={16} />
            <span>Equipment Claim Reviews</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'catalog' && <EquipmentPriceCatalog />}
      {activeTab === 'claims' && <FlaggedEquipmentClaims />}
    </div>
  );
}

