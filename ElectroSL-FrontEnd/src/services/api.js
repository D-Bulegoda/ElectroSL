// Base API configuration for ElectroSL Backend
export const API_BASE_URL = 'http://localhost:5192/api';

export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const response = await fetch(url, { ...options, headers });
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

export const fetchJobs = async (lat = 6.9271, lng = 79.8612) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Job/nearby?lat=${lat}&lng=${lng}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};