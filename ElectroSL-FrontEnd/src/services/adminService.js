import { API_BASE_URL, fetchWithAuth, fetchBlobWithAuth } from './api';

export const adminService = {
  // Technician Applications
  getApplications: async (status = 'Pending') => {
    const url = status 
      ? `/admin/applications?status=${encodeURIComponent(status)}` 
      : `/admin/applications`;
    return fetchWithAuth(url, { method: 'GET' });
  },

  getApplicationDetail: async (profileId) => {
    return fetchWithAuth(`/admin/applications/${profileId}`, { method: 'GET' });
  },

  approveApplication: async (profileId) => {
    return fetchWithAuth(`/admin/applications/${profileId}/approve`, { method: 'PUT' });
  },

  rejectApplication: async (profileId, reason) => {
    return fetchWithAuth(`/admin/applications/${profileId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  approveWithOverride: async (profileId, explanation) => {
    return fetchWithAuth(`/admin/applications/${profileId}/approve-override`, {
      method: 'PUT',
      body: JSON.stringify({ explanation })
    });
  },

  revokeApplication: async (profileId, reason) => {
    return fetchWithAuth(`/admin/applications/${profileId}/revoke`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  },

  getAuditLogs: async (profileId) => {
    return fetchWithAuth(`/admin/applications/${profileId}/audit-logs`, { method: 'GET' });
  },

  getDocumentUrl: (profileId, docType) => {
    return `${API_BASE_URL}/admin/applications/${profileId}/document/${docType}`;
  },

  getDocumentBlob: async (profileId, docType) => {
    return fetchBlobWithAuth(`/admin/applications/${profileId}/document/${docType}`);
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    return fetchWithAuth('/admin/dashboard-stats', { method: 'GET' });
  },

  // Equipment Price Catalog
  getCatalogItems: async (category = '', search = '', isActive = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      params.append('isActive', isActive);
    }

    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/admin/catalog${qs}`, { method: 'GET' });
  },

  getCatalogItem: async (itemId) => {
    return fetchWithAuth(`/admin/catalog/${itemId}`, { method: 'GET' });
  },

  getCatalogPriceHistory: async (itemId) => {
    return fetchWithAuth(`/admin/catalog/${itemId}/history`, { method: 'GET' });
  },

  createCatalogItem: async (itemData) => {
    return fetchWithAuth('/admin/catalog', {
      method: 'POST',
      body: JSON.stringify(itemData)
    });
  },

  updateCatalogItem: async (itemId, itemData) => {
    return fetchWithAuth(`/admin/catalog/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(itemData)
    });
  },

  deleteCatalogItem: async (itemId, concurrencyVersion) => {
    const qs = concurrencyVersion !== undefined && concurrencyVersion !== null ? `?concurrencyVersion=${concurrencyVersion}` : '';
    return fetchWithAuth(`/admin/catalog/${itemId}${qs}`, { method: 'DELETE' });
  },

  activateCatalogItem: async (itemId, concurrencyVersion) => {
    const qs = concurrencyVersion !== undefined && concurrencyVersion !== null ? `?concurrencyVersion=${concurrencyVersion}` : '';
    return fetchWithAuth(`/admin/catalog/${itemId}/activate${qs}`, { method: 'PUT' });
  },

  // Flagged Equipment Price Claims Review
  getEquipmentClaims: async (status = 'FlaggedForReview', search = '', category = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/admin/equipment-claims${qs}`, { method: 'GET' });
  },

  getEquipmentClaimDetail: async (claimId) => {
    return fetchWithAuth(`/admin/equipment-claims/${claimId}`, { method: 'GET' });
  },

  approveEquipmentClaim: async (claimId, reviewNotes = '') => {
    return fetchWithAuth(`/admin/equipment-claims/${claimId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ reviewNotes })
    });
  },

  rejectEquipmentClaim: async (claimId, reviewNotes) => {
    return fetchWithAuth(`/admin/equipment-claims/${claimId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reviewNotes })
    });
  },

  // User Management (Phase 3)
  getUsers: async (role = '', search = '', status = '') => {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/admin/users${qs}`, { method: 'GET' });
  },

  getUserDetail: async (userId) => {
    return fetchWithAuth(`/admin/users/${userId}`, { method: 'GET' });
  },

  activateUser: async (userId, concurrencyVersion) => {
    return fetchWithAuth(`/admin/users/${userId}/activate`, {
      method: 'PUT',
      body: JSON.stringify({ concurrencyVersion })
    });
  },

  deactivateUser: async (userId, concurrencyVersion) => {
    return fetchWithAuth(`/admin/users/${userId}/deactivate`, {
      method: 'PUT',
      body: JSON.stringify({ concurrencyVersion })
    });
  },

  suspendUser: async (userId, reason, concurrencyVersion) => {
    return fetchWithAuth(`/admin/users/${userId}/suspend`, {
      method: 'PUT',
      body: JSON.stringify({ reason, concurrencyVersion })
    });
  },

  restoreUser: async (userId, concurrencyVersion) => {
    return fetchWithAuth(`/admin/users/${userId}/restore`, {
      method: 'PUT',
      body: JSON.stringify({ concurrencyVersion })
    });
  },

  // Job Dispatch & Operational Management (Phase 3 Task 3.3)
  getJobOperationalSummary: async () => {
    return fetchWithAuth('/admin/jobs/operational-summary', { method: 'GET' });
  },

  getAdminJobs: async ({ status = '', jobType = '', isEmergency = null, search = '', page = 1, pageSize = 10, customerId = null, electricianId = null } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (jobType) params.append('jobType', jobType);
    if (isEmergency !== null && isEmergency !== undefined && isEmergency !== '') {
      params.append('isEmergency', isEmergency);
    }
    if (search) params.append('search', search);
    if (page) params.append('page', page);
    if (pageSize) params.append('pageSize', pageSize);
    if (customerId) params.append('customerId', customerId);
    if (electricianId) params.append('electricianId', electricianId);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/admin/jobs${qs}`, { method: 'GET' });
  },

  getAdminJobDetail: async (jobId) => {
    return fetchWithAuth(`/admin/jobs/${jobId}`, { method: 'GET' });
  },

  getEligibleElectricians: async (jobId) => {
    return fetchWithAuth(`/admin/jobs/${jobId}/eligible-electricians`, { method: 'GET' });
  },

  assignJob: async (jobId, { electricianId, concurrencyVersion, notes }) => {
    return fetchWithAuth(`/admin/jobs/${jobId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ electricianId, concurrencyVersion, notes })
    });
  },

  reassignJob: async (jobId, { newElectricianId, reason, concurrencyVersion }) => {
    return fetchWithAuth(`/admin/jobs/${jobId}/reassign`, {
      method: 'PUT',
      body: JSON.stringify({ newElectricianId, reason, concurrencyVersion })
    });
  },

  cancelJob: async (jobId, { reason, concurrencyVersion }) => {
    return fetchWithAuth(`/admin/jobs/${jobId}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ reason, concurrencyVersion })
    });
  },

  resolveJobDispute: async (jobId, { resolutionNotes, concurrencyVersion }) => {
    return fetchWithAuth(`/admin/jobs/${jobId}/resolve-dispute`, {
      method: 'PUT',
      body: JSON.stringify({ resolutionNotes, concurrencyVersion })
    });
  }
};

export default adminService;
