import { z } from 'zod';
import { executeQuery } from '../utils/database';

// Define the UserAttributes interface
interface UserAttributes {
  id?: number;
  email: string;
  passwordHash: string;
  role?: 'user' | 'manager' | 'admin';
  isActive?: boolean;
  lastLoginAt?: Date;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the User model
class User {
  public id?: number;
  public email!: string;
  public passwordHash!: string;
  public role!: 'user' | 'manager' | 'admin';
  public isActive: boolean = true;
  public lastLoginAt?: Date;
  public resetToken?: string | null;
  public resetTokenExpiry?: Date | null;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(attributes: UserAttributes) {
    this.id = attributes.id;
    this.email = attributes.email;
    this.passwordHash = attributes.passwordHash;
    this.role = attributes.role || 'user';
    this.isActive = attributes.isActive ?? true;
    this.lastLoginAt = attributes.lastLoginAt;
    this.resetToken = attributes.resetToken;
    this.resetTokenExpiry = attributes.resetTokenExpiry;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  static create(attributes: UserAttributes): User {
    return new User(attributes);
  }

  // Add a static method for input validation using Zod
  static validate = z.object({
    email: z.string().email(),
    passwordHash: z.string(),
    role: z.enum(['user', 'manager', 'admin']),
    isActive: z.boolean().optional().default(true),
    lastLoginAt: z.date().optional(),
    resetToken: z.string().nullable().optional(),
    resetTokenExpiry: z.date().nullable().optional()
  });

  // Method to check if reset token is valid
  static async isValidResetToken(token: string): Promise<boolean> {
    const user = await getUserByResetToken(token);
    if (!user || !user.resetTokenExpiry) return false;
    return user.resetTokenExpiry > new Date();
  }
}

export async function createUser(user: UserAttributes): Promise<User> {
    const { email, passwordHash, role = 'user', isActive = true } = user;
    const result = await executeQuery<UserAttributes>(
      `INSERT INTO users (email, passwordHash, role, isActive, createdAt, updatedAt) 
       OUTPUT INSERTED.* 
       VALUES (@email, @passwordHash, @role, @isActive, GETDATE(), GETDATE())`,
      { email, passwordHash, role, isActive }
    );
    return User.create(result[0]);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
    const result = await executeQuery<UserAttributes>(
        'SELECT * FROM users WHERE email = @email AND isActive = 1',
        { email }
    );
    return result[0] ? User.create(result[0]) : undefined;
}

export async function getUserById(id: number): Promise<User | undefined> {
    const result = await executeQuery<UserAttributes>(
        'SELECT * FROM users WHERE id = @id AND isActive = 1',
        { id }
    );
    return result[0] ? User.create(result[0]) : undefined;
}

export async function getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await executeQuery<UserAttributes>(
        'SELECT * FROM users WHERE resetToken = @token AND isActive = 1',
        { token }
    );
    return result[0] ? User.create(result[0]) : undefined;
}

export async function updateUserResetToken(
    userId: number, 
    resetToken: string | null, 
    resetTokenExpiry: Date | null
): Promise<void> {
    await executeQuery(
        `UPDATE users 
         SET resetToken = @resetToken, 
             resetTokenExpiry = @resetTokenExpiry,
             updatedAt = GETDATE()
         WHERE id = @userId`,
        { userId, resetToken, resetTokenExpiry }
    );
}

export async function updateUserPassword(
    userId: number,
    newPasswordHash: string
): Promise<void> {
    await executeQuery(
        `UPDATE users 
         SET passwordHash = @newPasswordHash,
             resetToken = NULL,
             resetTokenExpiry = NULL,
             updatedAt = GETDATE()
         WHERE id = @userId`,
        { userId, newPasswordHash }
    );
}

export async function updateLastLogin(userId: number): Promise<void> {
    await executeQuery(
        `UPDATE users 
         SET lastLoginAt = GETDATE(),
             updatedAt = GETDATE()
         WHERE id = @userId`,
        { userId }
    );
}

export async function deactivateUser(userId: number): Promise<void> {
    await executeQuery(
        `UPDATE users 
         SET isActive = 0,
             updatedAt = GETDATE()
         WHERE id = @userId`,
        { userId }
    );
}

export default User;
