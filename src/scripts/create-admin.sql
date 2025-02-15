USE qcs_management;
GO

-- Insert admin user with pre-hashed password (Admin123!@#)
INSERT INTO Users (Email, PasswordHash, FirstName, LastName, Role, IsActive)
VALUES (
    'admin@qcsmanagement.com',
    '$2b$10$rPQcHxXYxKtPZxWqgXU8UOJ5uxhZs1qZEtGaGBxgfvNrMD/DyZEYe',
    'Admin',
    'User',
    'admin',
    1
);