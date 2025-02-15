import React from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const AuthLayout = () => {
  const { user } = useAuth();

  // Redirect to dashboard if user is already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <h1 className="text-3xl font-bold text-primary-600">QCS Management</h1>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <Outlet />
        </div>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <div className="space-x-4">
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
              Privacy Policy
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-gray-900">
              Terms of Service
            </Link>
            <span className="text-gray-400">|</span>
            <Link to="/help" className="text-sm text-gray-600 hover:text-gray-900">
              Help Center
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            &copy; {new Date().getFullYear()} QCS Management. All rights reserved.
          </p>
        </div>
      </div>

      {/* Alert Container */}
      <div className="fixed bottom-4 right-4 z-50" id="alert-container">
        {/* Alerts will be rendered here */}
      </div>
    </div>
  );
};

export default AuthLayout;
