import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage.tsx';
import { AuthContext } from '../../../contexts/AuthContext';
import { AuthUser, UserRole } from '../../../types/auth';
import '@testing-library/jest-dom';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as jest.Mock;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  const mockLogout = jest.fn();

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: null, login: mockLogin, logout: mockLogout }}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser: AuthUser = {
      id: 1,
      email: 'test@example.com',
      role: 'user' as UserRole
    };

    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: mockUser
        }
      })
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
        credentials: 'include',
      });
      expect(localStorage.getItem('accessToken')).toBe('mock-access-token');
      expect(localStorage.getItem('refreshToken')).toBe('mock-refresh-token');
      expect(mockLogin).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on login failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: { message: 'Invalid credentials' }
      })
    });

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // HTML5 validation will prevent form submission and show browser validation messages
    expect(screen.getByLabelText(/email/i)).toBeInvalid();
    expect(screen.getByLabelText(/password/i)).toBeInvalid();
  });
});
