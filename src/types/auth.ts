export type UserRole = 'admin' | 'manager' | 'user' | 'inspector';

export interface User {
  id: number;
  email: string;
  role: UserRole;
}

// Used for authentication
export interface AuthUser extends User {
  password?: string;
}

// Used in JWT tokens
export interface JWTUser {
  id: number;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}
