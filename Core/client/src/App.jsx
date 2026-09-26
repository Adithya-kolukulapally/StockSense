import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Receipts from './pages/Receipts';
import Deliveries from './pages/Deliveries';
import Transfers from './pages/Transfers';
import Adjustments from './pages/Adjustments';
import MoveHistory from './pages/MoveHistory';
import Warehouses from './pages/Warehouses';
import Categories from './pages/Categories';

// Shell layout for protected app views
const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Authentication Routes matching Authentication module */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Profile Route */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Protected Core Application Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Products />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/operations/receipts"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Receipts />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/operations/deliveries"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Deliveries />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/operations/transfers"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Transfers />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/operations/adjustments"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Adjustments />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/operations/history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <MoveHistory />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/warehouses"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Warehouses />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/categories"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Categories />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Default root redirects to /dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
