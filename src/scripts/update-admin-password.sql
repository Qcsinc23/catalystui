USE qcs_management;
GO

-- Update admin user's password hash
UPDATE Users 
SET PasswordHash = '$2b$10$rPQcHxXYxKtPZxWqgXU8UOJ5uxhZs1qZEtGaGBxgfvNrMD/DyZEYe'
WHERE Email = 'admin@qcsmanagement.com';