import React, { useState } from 'react';
import Modal from '../common/Modal';

const DocumentViewer = ({ isOpen, onClose, title, documentUrl, docType }) => {
  const [zoom, setZoom] = useState(1);

  if (!isOpen) return null;

  const isPdf = documentUrl && documentUrl.toLowerCase().endsWith('.pdf');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || `Verification Document (${docType?.toUpperCase() || 'Doc'})`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 500 }}>
            Type: <strong>{docType?.toUpperCase()}</strong>
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Zoom -
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Zoom +
            </button>
            {documentUrl && (
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '0.25rem',
                  textDecoration: 'none',
                  fontSize: '0.8rem'
                }}
              >
                Open in Tab ↗
              </a>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div
          style={{
            minHeight: '320px',
            maxHeight: '480px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.375rem',
            padding: '1rem'
          }}
        >
          {!documentUrl ? (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.5rem' }}>📄</span>
              <p style={{ margin: 0, fontWeight: 500 }}>No document uploaded for this requirement.</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={documentUrl}
              title="PDF Document Viewer"
              style={{ width: '100%', height: '420px', border: 'none' }}
            />
          ) : (
            <img
              src={documentUrl}
              alt="Verification Certificate"
              style={{
                maxWidth: '100%',
                transform: `scale(${zoom})`,
                transition: 'transform 0.2s ease',
                borderRadius: '0.25rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div style="text-align:center; color:#ef4444;"><p>Could not load document preview from ${documentUrl}</p></div>`;
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DocumentViewer;

