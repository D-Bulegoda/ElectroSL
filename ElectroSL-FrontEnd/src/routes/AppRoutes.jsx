
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Authentication pages
import Login from '../pages/Auth/Login';
import SignUpElectrician from '../pages/Auth/SignUpElectrician';

// Customer pages
import CustomerHome from '../pages/Customer/CustomerHome';
import PostNewJob from '../pages/Customer/PostNewJob';
import EmergencySOS from '../pages/Customer/EmergencySOS';
import ViewBidsAndQuotations from '../pages/Customer/ViewBidsAndQuotations';
import LiveJobTracking from '../pages/Customer/LiveJobTracking';
import ApproveEquipmentBill from '../pages/Customer/ApproveEquipmentBill';
import CheckoutPayment from '../pages/Customer/CheckoutPayment';
import SubmitReview from '../pages/Customer/SubmitReview';

// Electrician pages
import ElectricianDashboard from '../pages/Electrician/ElectricianDashboard';
import ToggleAvailability from '../pages/Electrician/ToggleAvailability';
import IncomingJobAlerts from '../pages/Electrician/IncomingJobAlerts';
import SubmitQuotationBid from '../pages/Electrician/SubmitQuotationBid';
import ActiveJobExecution from '../pages/Electrician/ActiveJobExecution';
import OTPStartWork from '../pages/Electrician/OTPStartWork';
import SubmitEquipmentList from '../pages/Electrician/SubmitEquipmentList';
import DigitalPortfolio from '../pages/Electrician/DigitalPortfolio';
import WalletAndEarnings from '../pages/Electrician/WalletAndEarnings';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/customer/home" replace />} />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/electrician/signup" element={<SignUpElectrician />} />

        {/* Customer Portal */}
        <Route path="/customer/home" element={<CustomerHome />} />
        <Route path="/customer/post-job" element={<PostNewJob />} />
        <Route path="/customer/emergency" element={<EmergencySOS />} />
        <Route path="/customer/bids" element={<ViewBidsAndQuotations />} />
        <Route path="/customer/tracking" element={<LiveJobTracking />} />
        <Route path="/customer/equipment-bill" element={<ApproveEquipmentBill />} />
        <Route path="/customer/payment" element={<CheckoutPayment />} />
        <Route path="/customer/review" element={<SubmitReview />} />

        {/* Electrician Portal */}
        <Route path="/electrician/dashboard" element={<ElectricianDashboard />} />
        <Route path="/electrician/availability" element={<ToggleAvailability />} />
        <Route path="/electrician/jobs" element={<IncomingJobAlerts />} />
        <Route path="/electrician/quotation" element={<SubmitQuotationBid />} />
        <Route path="/electrician/active-jobs" element={<ActiveJobExecution />} />
        <Route path="/electrician/otp-verification" element={<OTPStartWork />} />
        <Route path="/electrician/equipment" element={<SubmitEquipmentList />} />
        <Route path="/electrician/portfolio" element={<DigitalPortfolio />} />
        <Route path="/electrician/wallet" element={<WalletAndEarnings />} />

        {/* Unknown routes */}
        <Route path="*" element={<h2>Page not found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
