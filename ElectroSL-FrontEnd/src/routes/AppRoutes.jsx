import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getAuthSession } from '../services/authService';

// Public & Hidden Auth Pages
import Home from '../pages/Home/Home';
import AdminLogin from '../pages/Admin/AdminLogin';

// Protected Route Guard (Existing Admin Guard)
import ProtectedRoute from './ProtectedRoute';

// Authentication pages
import Login from '../pages/Auth/Login';
import CustomerSignUp from '../pages/Auth/CustomerSignUp';
import SignUpElectrician from '../pages/Auth/SignUpElectrician';

// Customer pages
import CustomerHome from '../pages/Customer/CustomerHome';
import PostNewJob from '../pages/Customer/PostNewJob';
import EmergencySOS from '../pages/Customer/EmergencySOS';
import LiveJobTracking from '../pages/Customer/LiveJobTracking';
import ApproveEquipmentBill from '../pages/Customer/ApproveEquipmentBill';
import CheckoutPayment from '../pages/Customer/CheckoutPayment';
import SubmitReview from '../pages/Customer/SubmitReview';

// Electrician pages
import ElectricianDashboard from '../pages/Electrician/ElectricianDashboard';
import ToggleAvailability from '../pages/Electrician/ToggleAvailability';
import IncomingJobAlerts from '../pages/Electrician/IncomingJobAlerts';
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

// Payment, Notification & Profile Components
import MockPaymentGateway from '../components/payments/MockPaymentGateway';
import NotificationBell from '../components/NotificationBell';
import UserProfileBadge from '../components/UserProfileBadge';

// Inline guard: requires a logged-in Customer account
function RequireCustomerProfile({ children, fallback = '/login' }) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session?.token) {
    const target = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${fallback}?redirect=${target}`} replace />;
  }

  if (session.role !== 'Customer') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Inline guard: requires a logged-in Electrician account
function RequireElectricianAuth({ children }) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session?.token) {
    const target = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${target}`} replace />;
  }

  if (session.role !== 'Electrician') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <UserProfileBadge />
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
        <Route path="/signup" element={<CustomerSignUp />} />
        <Route path="/customer/signup" element={<CustomerSignUp />} />
        <Route path="/electrician/signup" element={<SignUpElectrician />} />
        <Route path="/signup-electrician" element={<SignUpElectrician />} />

        {/* Customer Portal (Protected: Customer Login Required) */}
        <Route
          path="/customer/home"
          element={
            <RequireCustomerProfile>
              <CustomerHome />
            </RequireCustomerProfile>
          }
        />
        <Route
          path="/customer/post-job"
          element={
            <RequireCustomerProfile fallback="/signup">
              <PostNewJob />
            </RequireCustomerProfile>
          }
        />
        <Route
          path="/customer/emergency"
          element={
            <RequireCustomerProfile>
              <EmergencySOS />
            </RequireCustomerProfile>
          }
        />
        {/* Redirect legacy bids route to live job tracking */}
        <Route path="/customer/bids" element={<Navigate replace to="/customer/tracking" />} />
        <Route
          path="/customer/tracking"
          element={
            <RequireCustomerProfile>
              <LiveJobTracking />
            </RequireCustomerProfile>
          }
        />
        <Route
          path="/customer/equipment-bill"
          element={
            <RequireCustomerProfile>
              <ApproveEquipmentBill />
            </RequireCustomerProfile>
          }
        />
        <Route
          path="/customer/payment"
          element={
            <RequireCustomerProfile>
              <CheckoutPayment />
            </RequireCustomerProfile>
          }
        />
        <Route
          path="/customer/review"
          element={
            <RequireCustomerProfile>
              <SubmitReview />
            </RequireCustomerProfile>
          }
        />

        {/* Electrician Portal (Protected: Electrician Login Required) */}
        <Route
          path="/electrician/dashboard"
          element={
            <RequireElectricianAuth>
              <ElectricianDashboard />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/availability"
          element={
            <RequireElectricianAuth>
              <ToggleAvailability />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/jobs"
          element={
            <RequireElectricianAuth>
              <IncomingJobAlerts />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/quotation"
          element={<Navigate replace to="/electrician/jobs" />}
        />
        <Route
          path="/electrician/active-jobs"
          element={
            <RequireElectricianAuth>
              <ActiveJobExecution />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/otp-verification"
          element={
            <RequireElectricianAuth>
              <OTPStartWork />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/equipment"
          element={
            <RequireElectricianAuth>
              <SubmitEquipmentList />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/portfolio"
          element={
            <RequireElectricianAuth>
              <DigitalPortfolio />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/wallet"
          element={
            <RequireElectricianAuth>
              <WalletAndEarnings />
            </RequireElectricianAuth>
          }
        />
        <Route
          path="/electrician/simulator"
          element={
            <RequireElectricianAuth>
              <CircuitSimulator />
            </RequireElectricianAuth>
          }
        />

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