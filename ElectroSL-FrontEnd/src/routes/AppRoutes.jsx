import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Auth/Login';
import CustomerHome from '../pages/Customer/CustomerHome';
import ElectricianDashboard from '../pages/Electrician/ElectricianDashboard';
import AdminDashboard from '../pages/Admin/AdminDashboard';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoute allowedRole="Customer" />}>
          <Route path="/customer/home" element={<CustomerHome />} />
        </Route>

        {/* Protected Electrician Routes */}
        <Route element={<ProtectedRoute allowedRole="Electrician" />}>
          <Route path="/electrician/dashboard" element={<ElectricianDashboard />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="Admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;