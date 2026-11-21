import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRole }) => {
  const { user, isAuthenticated, loading, role } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    // If route requires Admin, redirect to the hidden Admin Login portal
    if (allowedRole === 'Admin') {
      return <Navigate to="/admin-portal/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If a Customer or Electrician attempts to enter Admin portal, send them back to Admin Login
    if (allowedRole === 'Admin') {
      return <Navigate to="/admin-portal/login" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
