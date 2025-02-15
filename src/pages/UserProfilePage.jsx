import React from 'react';
import MainLayout from '../layouts/MainLayout';

const UserProfilePage = () => {
  return (
    <MainLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
        <p className="mt-4 text-gray-600">
          This page will display user profile information and settings.
        </p>
      </div>
    </MainLayout>
  );
};

export default UserProfilePage;
