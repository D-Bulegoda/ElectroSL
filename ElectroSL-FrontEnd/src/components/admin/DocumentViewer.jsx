import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { fetchBlobWithAuth } from '../../services/api';
import { ExternalLinkIcon } from './AdminIcons';

const DocumentViewer = ({ isOpen, onClose, title, documentUrl, docType }) => {
  const [zoom, setZoom] = useState(1);
  const [blobUrl, setBlobUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let currentBlobUrl = null;

    if (!isOpen || !documentUrl) {
      setBlobUrl(null);
      setError(null);
      setLoading(false);
      setZoom(1);
      return;
    }

    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        setZoom(1);

        const { blob, contentType } = await fetchBlobWithAuth(documentUrl);
        currentBlobUrl = URL.createObjectURL(blob);
        setBlobUrl(currentBlobUrl);
        setIsPdf(contentType.toLowerCase().includes('pdf') || (docType && docType.toLowerCase().includes('pdf')));
      } catch (err) {
        console.error('DocumentViewer load error:', err);
        setError(err.message || 'Could not load the requested document.');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();

    return () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [isOpen, documentUrl, docType]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title || `Verification Document (${docType?.toUpperCase() || 'Doc'})`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Controls Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: '0.65rem'
          }}
        >
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Document Type: <strong style={{ color: '#0f172a' }}>{docType?.toUpperCase() || 'FILE'}</strong>
          </span>

          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {!isPdf && blobUrl && !loading && !error && (
              <>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Zoom -
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                  className="admin-btn admin-btn-secondary admin-btn-sm"
                >
                  Zoom +
                </button>
              </>
            )}

            {blobUrl && !loading && !error && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                <span>Open in Tab</span>
                <ExternalLinkIcon size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Content Viewer Body (Strict Light Canvas) */}
        <div
          style={{
            minHeight: '340px',
            maxHeight: '520px',
            overflow: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            borderRadius: '4px',
            padding: '1rem',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', color: '#64748b' }}>
              <div
                style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  border: '2px solid #2563eb',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '0.5rem'
                }}
              />
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#475569' }}>
                Fetching document from secure storage...
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: '#dc2626', padding: '1rem' }}>
              <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.25rem' }}>⚠️</span>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, fontSize: '0.875rem' }}>Unable to Preview Document</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#991b1b' }}>{error}</p>
            </div>
          ) : !blobUrl ? (
            <div style={{ textAlign: 'center', color: '#94a3b8' }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: '0.8125rem' }}>No document available to preview.</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={blobUrl}
              title={title || 'Document Viewer'}
              style={{
                width: '100%',
                height: '460px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                backgroundColor: '#ffffff'
              }}
            />
          ) : (
            <img
              src={blobUrl}
              alt={title || 'Verification Document'}
              style={{
                maxWidth: '100%',
                maxHeight: '440px',
                transform: `scale(${zoom})`,
                transition: 'transform 0.15s ease',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                objectFit: 'contain'
              }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DocumentViewer;
