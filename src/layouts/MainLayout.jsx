import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path ? 'nav-link-active' : '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="content-container">
          <div className="flex-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary-600">
                QCS Management
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-4">
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/events" className={`nav-link ${isActive('/events')}`}>
                Events
              </Link>
              <Link to="/inventory" className={`nav-link ${isActive('/inventory')}`}>
                Inventory
              </Link>
              <Link to="/reports" className={`nav-link ${isActive('/reports')}`}>
                Reports
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="btn btn-secondary btn-sm">
                <span className="sr-only">Notifications</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                  />
                </svg>
                <span className="badge badge-error badge-sm badge-top-right">3</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-sm focus-ring rounded-md p-2"
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
                    alt="User avatar"
                  />
                  <span className="hidden md:block font-medium text-gray-700">
                    {user?.firstName} {user?.lastName}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu">
                      <button
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="flex">
        <aside className="hidden lg:block w-64 h-[calc(100vh-4rem)] border-r border-gray-200 bg-white">
          <div className="p-4">
            <nav className="space-y-1">
              <Link
                to="/dashboard"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/dashboard')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Dashboard
              </Link>

              <Link
                to="/events"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/events')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Events
              </Link>

              <Link
                to="/inventory"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/inventory')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                Inventory
              </Link>

              <Link
                to="/reports"
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  isActive('/reports')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Reports
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="content-container py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
