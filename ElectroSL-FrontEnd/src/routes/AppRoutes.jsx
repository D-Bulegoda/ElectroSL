import ToggleAvailability from '../pages/Electrician/ToggleAvailability';
import IncomingJobAlerts from '../pages/Electrician/IncomingJobAlerts';
import SubmitQuotationBid from '../pages/Electrician/SubmitQuotationBid';
import ActiveJobExecution from '../pages/Electrician/ActiveJobExecution';
import OTPStartWork from '../pages/Electrician/OTPStartWork';
import SubmitEquipmentList from '../pages/Electrician/SubmitEquipmentList';
import DigitalPortfolio from '../pages/Electrician/DigitalPortfolio';
import WalletAndEarnings from '../pages/Electrician/WalletAndEarnings';
import SignUpElectrician from '../pages/Auth/SignUpElectrician';

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Auth/Login';

import ElectricianDashboard from '../pages/Electrician/ElectricianDashboard';
import AdminDashboard from '../pages/Admin/AdminDashboard';

const AppRoutes = () => {
  return (
    <Router>
      
      <Routes>
        <Route path="/" element={<Navigate to="/electrician/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

  {/* Keep your other existing routes below */}  
      
        <Route path="/electrician/dashboard" element={<ElectricianDashboard />} />

        <Route path="/electrician/availability" element={<ToggleAvailability />} />  

        <Route path="/electrician/jobs" element={<IncomingJobAlerts />} />

        <Route path="/electrician/quotation" element={<SubmitQuotationBid />} />

        <Route path="/electrician/active-jobs" element={<ActiveJobExecution />} />

        <Route path="/electrician/otp-verification" element={<OTPStartWork />} />

        <Route path="/electrician/equipment" element={<SubmitEquipmentList />} />

        <Route path="/electrician/portfolio" element={<DigitalPortfolio />} />

        <Route path="/electrician/wallet" element={<WalletAndEarnings />} />

       
       <Route path="/electrician/signup" element={<SignUpElectrician />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="Admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRoutes;