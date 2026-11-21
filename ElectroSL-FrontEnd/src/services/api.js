// Base API configuration for ElectroSL Backend
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5192/api';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const fetchWithAuth = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {})
  };

  // If the body is FormData, do not set Content-Type header so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.title || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText || `HTTP Error ${response.status}`;
    }

    if (response.status === 401) {
      // Dispatches unauthenticated event if token expired or invalid
      window.dispatchEvent(new CustomEvent('electrosl:unauthorized'));
    }

    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

export const fetchBlobWithAuth = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorDetail = 'Failed to fetch document';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText || `HTTP Error ${response.status}`;
    }

    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('electrosl:unauthorized'));
    }

    throw new Error(errorDetail);
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const blob = await response.blob();
  return { blob, contentType };
};

export const fetchJobs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/job/nearby?lat=6.9271&lng=79.8612`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};
