const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText || `HTTP Error ${response.status}`;
    }
    throw new Error(errorDetail);
  }
  return response.json();
};

export const adminService = {
  // Technician Applications
  getApplications: async (status = 'Pending') => {
    const url = status ? `${API_BASE_URL}/admin/applications?status=${encodeURIComponent(status)}` : `${API_BASE_URL}/admin/applications`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getApplicationDetail: async (profileId) => {
    const res = await fetch(`${API_BASE_URL}/admin/applications/${profileId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  approveApplication: async (profileId) => {
    const res = await fetch(`${API_BASE_URL}/admin/applications/${profileId}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  rejectApplication: async (profileId, reason) => {
    const res = await fetch(`${API_BASE_URL}/admin/applications/${profileId}/reject`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });
    return handleResponse(res);
  },

  getDocumentUrl: (profileId, docType) => {
    return `${API_BASE_URL}/admin/applications/${profileId}/document/${docType}`;
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard-stats`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // Equipment Price Catalog
  getCatalogItems: async (category = '', search = '') => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE_URL}/admin/catalog${qs}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  getCatalogItem: async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/admin/catalog/${itemId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  createCatalogItem: async (itemData) => {
    const res = await fetch(`${API_BASE_URL}/admin/catalog`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    return handleResponse(res);
  },

  updateCatalogItem: async (itemId, itemData) => {
    const res = await fetch(`${API_BASE_URL}/admin/catalog/${itemId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(itemData)
    });
    return handleResponse(res);
  },

  deleteCatalogItem: async (itemId) => {
    const res = await fetch(`${API_BASE_URL}/admin/catalog/${itemId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};

export default adminService;

