import User from '../models/User';
import { AuthUser } from '../types/auth';

export const toAuthUser = (user: User): AuthUser => {
  if (!user.id) {
    throw new Error('User ID is required');
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role
  };
};

export const toAuthUserArray = (users: User[]): AuthUser[] => {
  return users.map(toAuthUser);
};
