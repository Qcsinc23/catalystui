import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/dashboard/DashboardPage';
import InventoryPage from './pages/inventory/InventoryPage';
import ReportsPage from './pages/reports/ReportsPage';
import EventsPage from './pages/events/EventsPage';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import { AuthProvider } from './contexts/AuthContext.jsx';
import RequireAuth from './components/auth/RequireAuth.jsx';

const App = () => {

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <MainLayout><DashboardPage /></MainLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/inventory"
            element={
              <RequireAuth>
                <MainLayout><InventoryPage /></MainLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <MainLayout><ReportsPage /></MainLayout>
              </RequireAuth>
            }
          />
          <Route
            path="/events"
            element={
              <RequireAuth>
                <MainLayout><EventsPage /></MainLayout>
              </RequireAuth>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
