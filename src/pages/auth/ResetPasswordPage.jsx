// src/pages/auth/ResetPasswordPage.jsx
// This component allows users to reset their password using a token from a password reset email.
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
     const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');  // Get token from URL query parameter


     const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          return;
        }
        if (!token) {
            setError('Password reset token is missing.');
            return;
         }


        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                 body: JSON.stringify({ token, password }),

            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Password reset failed');
            }
            setMessage('Password has been reset successfully.  Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
             }, 3000);
        }
        catch (error) {
             setError(error.message);
        }
    }
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* ... (layout, logo, heading, etc.) */}
                 <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Reset Password
                    </h2>
                    <p className='text-center text-gray-700'>Enter your new password</p>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="token" value={token || ''} />
                    <div className="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label htmlFor="password" className="sr-only">
                        Password
                        </label>
                        <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="New Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="sr-only">
                        Confirm Password
                        </label>
                        <input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                    </div>
                    <div>
                        <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Reset Password
                        </button>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
                   </div>
                </form>
            </div>
        </div>
    );

};

export default ResetPasswordPage;
