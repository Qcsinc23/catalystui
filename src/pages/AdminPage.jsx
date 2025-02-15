import React from 'react';
import MainLayout from '../layouts/MainLayout';

const AdminPage = () => {
  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
        <p className="mt-4 text-gray-600">
          This page will display admin-only content and functionality.
        </p>
      </div>
    </MainLayout>
  );
};

export default AdminPage;
