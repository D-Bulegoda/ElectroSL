import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Public & Hidden Auth Pages
import Home from '../pages/Home/Home';
import AdminLogin from '../pages/Admin/AdminLogin';

// Protected Route Guard
import ProtectedRoute from './ProtectedRoute';

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
import CircuitSimulator from '../pages/Electrician/CircuitSimulator';

// Admin pages
import AdminLayout from '../pages/Admin/AdminLayout';
import AdminDashboard from '../pages/Admin/AdminDashboard';
import TechnicianManagement from '../pages/Admin/TechnicianManagement';
import EquipmentManagement from '../pages/Admin/EquipmentManagement';
import UserManagement from '../pages/Admin/UserManagement';
import AdminJobManagement from '../pages/Admin/AdminJobManagement';
import AdminFinancialManagement from '../pages/Admin/AdminFinancialManagement';
import AdminAuditLogs from '../pages/Admin/AdminAuditLogs';
import AdminReports from '../pages/Admin/AdminReports';

// Payment & Notification Components
import MockPaymentGateway from '../components/payments/MockPaymentGateway';
import NotificationBell from '../components/NotificationBell';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Hidden Admin Login */}
        <Route path="/admin-portal/login" element={<AdminLogin />} />

        {/* Admin Portal (Protected: Admin Only) */}
        <Route element={<ProtectedRoute allowedRole="Admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="jobs" element={<AdminJobManagement />} />
            <Route path="users" element={<UserManagement />} />
            
            {/* Unified Technician Management & Backward Compatible Aliases */}
            <Route path="technicians" element={<TechnicianManagement />} />
            <Route path="approvals" element={<TechnicianManagement defaultTab="pending" />} />
            <Route path="approved" element={<TechnicianManagement defaultTab="approved" />} />
            <Route path="rejected" element={<TechnicianManagement defaultTab="rejected" />} />
            <Route path="applications/:id" element={<TechnicianManagement />} />

            {/* Unified Equipment Management & Backward Compatible Aliases */}
            <Route path="equipment" element={<EquipmentManagement />} />
            <Route path="catalog" element={<EquipmentManagement defaultTab="catalog" />} />
            <Route path="equipment-claims" element={<EquipmentManagement defaultTab="claims" />} />

            {/* Financial Management */}
            <Route path="finance" element={<AdminFinancialManagement />} />
            <Route path="financial" element={<AdminFinancialManagement />} />

            {/* Reports & Administration */}
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
          </Route>
        </Route>

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
        <Route path="/electrician/simulator" element={<CircuitSimulator />} />

        {/* Mock Payment & SignalR Notification Test Route */}
        <Route
          path="/payment-test"
          element={
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Payment & Notification Test</h2>
                <NotificationBell userId={1} />
              </div>
              <MockPaymentGateway jobId={1} defaultAmount={5000} />
            </div>
          }
        />

        {/* Unknown routes */}
        <Route path="*" element={<h2>Page not found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;