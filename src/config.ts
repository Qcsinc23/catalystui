import { Config } from './utils/types';

const config: Config = {
  app: {
    name: 'QCS Management System',
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3001', 10),
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
    baseUrl: process.env.BASE_URL || 'http://localhost:5173'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '1h') as `${number}${'h'}`,
    refreshTokenExpiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as `${number}${'d'}`,
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key',
    saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10)
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    from: process.env.EMAIL_FROM || 'QCS Management System <noreply@qcsmanagement.com>'
  },
  storage: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'qcs_management',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true'
  }
};

export default config;
