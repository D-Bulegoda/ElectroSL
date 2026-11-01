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