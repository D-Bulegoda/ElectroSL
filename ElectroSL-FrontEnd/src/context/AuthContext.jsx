import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext({
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  setUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on initial render
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token') || localStorage.getItem('jwt');
      const storedRole = localStorage.getItem('role');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        setRole(storedRole);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else if (storedRole) {
          setUser({ role: storedRole });
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session from localStorage:', e);
    } finally {
      setLoading(false);
    }

    // Auto logout on 401 event
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('electrosl:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('electrosl:unauthorized', handleUnauthorized);
  }, []);

  const login = (authToken, userData) => {
    const userRole = userData?.role || 'Customer';
    localStorage.setItem('token', authToken);
    localStorage.setItem('jwt', authToken);
    localStorage.setItem('role', userRole);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(authToken);
    setRole(userRole);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('role');
    localStorage.removeItem('user');

    setToken(null);
    setRole(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    role,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
