import { fetchWithAuth } from './api';

export const loginUser = async (credentials) => {
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const verifyOTP = async (otpCode) => {
  return fetchWithAuth('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ otpCode }),
  });
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('jwt');
  localStorage.removeItem('role');
  localStorage.removeItem('user');
};
