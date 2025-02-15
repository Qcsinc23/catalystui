# QCS Management System

A comprehensive Quality Control System (QCS) Management System built with React, Express, and SQL Server.

## Features

- User Authentication and Authorization
- Event Management
- Inventory Control
- Reporting System
- File Upload Management
- Real-time Updates
- Responsive Design with Catalyst UI Kit

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Catalyst UI Kit for components
- React Router for navigation
- PWA support

### Backend
- Node.js with Express
- TypeScript
- SQL Server for database
- JWT for authentication
- Pino for logging
- Express Validator for request validation

## Prerequisites

- Node.js >= 18.0.0
- SQL Server
- npm or yarn

## Getting Started

1. Clone the repository:
```bash
git clone [repository-url]
cd qcsmanagement2/catalystui
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

4. Initialize the database:
```bash
npm run db:init
```
This will create the database schema and a default admin user:
- Email: admin@qcsmanagement.com
- Password: Admin123!@#
(Change these credentials after first login)

5. Start the development server:
```bash
npm run dev
```
This will start both the frontend and backend servers:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
├── src/
│   ├── api/                 # Backend API components
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   └── routes/         # API routes
│   ├── models/             # Data models and types
│   ├── utils/              # Utility functions
│   ├── scripts/            # Database and setup scripts
│   ├── styles/             # CSS and style components
│   ├── layouts/            # Page layouts
│   └── pages/              # React components and pages
├── migrations/             # Database migration scripts
├── public/                # Static assets
└── uploads/               # File upload directory
```

## Development

- `npm run dev` - Start development servers
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run db:init` - Initialize database

## API Documentation

The API endpoints are organized around the following resources:

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

### Events
- GET /api/events
- POST /api/events
- GET /api/events/:id
- PUT /api/events/:id
- DELETE /api/events/:id

### Inventory
- GET /api/inventory
- POST /api/inventory
- GET /api/inventory/:id
- PUT /api/inventory/:id
- DELETE /api/inventory/:id

### Reports
- GET /api/reports/events
- GET /api/reports/inventory
- GET /api/reports/usage

## Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention
- Rate limiting
- File upload restrictions

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
