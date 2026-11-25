import { fetchWithAuth } from './api';

export const saveAuthSession = (authData, extraProfile = {}) => {
  if (!authData?.token) return;

  localStorage.setItem('token', authData.token);
  localStorage.setItem('jwt', authData.token);
  localStorage.setItem('role', authData.role || 'Customer');

  const existingRaw = localStorage.getItem('user');
  let existingUser = {};
  try {
    existingUser = existingRaw ? JSON.parse(existingRaw) : {};
  } catch {
    existingUser = {};
  }

  const userProfile = {
    userId: authData.userId,
    name: authData.name || existingUser.name || 'User',
    email: authData.email || existingUser.email || '',
    role: authData.role || 'Customer',
    permanentAddress:
      extraProfile.permanentAddress ||
      authData.permanentAddress ||
      existingUser.permanentAddress ||
      '',
    permanentDistrict:
      extraProfile.permanentDistrict ||
      authData.permanentDistrict ||
      existingUser.permanentDistrict ||
      '',
    permanentLocation:
      extraProfile.permanentLocation ||
      authData.permanentLocation ||
      existingUser.permanentLocation ||
      null,
    currentLocation:
      extraProfile.currentLocation ||
      authData.currentLocation ||
      existingUser.currentLocation ||
      null,
  };

  localStorage.setItem('user', JSON.stringify(userProfile));
  window.dispatchEvent(new Event('electrosl-auth-change'));
};

export const getAuthSession = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  const rawUser = localStorage.getItem('user');

  if (!token || !rawUser) return null;

  try {
    return {
      token,
      role: localStorage.getItem('role'),
      user: JSON.parse(rawUser),
    };
  } catch {
    logoutUser();
    return null;
  }
};

export const registerCustomer = async ({
  name,
  email,
  phone,
  password,
  permanentAddress,
  permanentDistrict,
  permanentLocation,
}) => {
  await fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      role: 'Customer',
      permanentAddress: permanentAddress.trim(),
      permanentDistrict,
    }),
  });

  const authData = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  });

  saveAuthSession(authData, {
    permanentAddress: permanentAddress.trim(),
    permanentDistrict,
    permanentLocation,
  });

  return authData;
};

export const updateElectricianLocation = async (userId, lat, lng) => {
  if (!userId || lat == null || lng == null) return null;

  const coords = { lat, lng };

  // Update localStorage user session immediately
  const raw = localStorage.getItem('user');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      parsed.currentLocation = coords;
      localStorage.setItem('user', JSON.stringify(parsed));
      window.dispatchEvent(new Event('electrosl-auth-change'));
    } catch {
      // ignore parse errors
    }
  }

  // Sync to backend PUT /api/Electrician/location
  try {
    await fetchWithAuth('/electrician/location', {
      method: 'PUT',
      body: JSON.stringify({ userId, lat, lng }),
    });
  } catch {
    // Keep local coordinates even if offline or unauthenticated during signup
  }

  return coords;
};

export const syncElectricianBrowserLocation = (userId) => {
  return new Promise((resolve) => {
    if (!navigator.geolocation || !userId) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = await updateElectricianLocation(
          userId,
          pos.coords.latitude,
          pos.coords.longitude
        );
        resolve(coords);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
};

export const loginUser = async (credentials) => {
  const authData = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  saveAuthSession(authData);

  // Automatically sync live GPS coordinates when an Electrician logs in
  if (authData.role === 'Electrician' && authData.userId) {
    await syncElectricianBrowserLocation(authData.userId);
  }

  return authData;
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
  window.dispatchEvent(new Event('electrosl-auth-change'));
};