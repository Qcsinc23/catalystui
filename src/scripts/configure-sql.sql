-- Enable SQL Server Authentication
sp_configure 'contained database authentication', 1;
RECONFIGURE;
GO

-- Enable mixed mode authentication
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode', 
    REG_DWORD,
    2;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'qcs_management')
BEGIN
    CREATE DATABASE qcs_management;
END
GO

USE qcs_management;
GO

-- Enable SQL Server authentication for the database
ALTER DATABASE qcs_management SET CONTAINMENT = PARTIAL;
GO

-- Create login if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'qcs_admin')
BEGIN
    CREATE LOGIN qcs_admin WITH PASSWORD = 'YourStrongPassword123!';
    ALTER SERVER ROLE sysadmin ADD MEMBER qcs_admin;
END
GO

-- Create database user
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'qcs_admin')
BEGIN
    CREATE USER qcs_admin FOR LOGIN qcs_admin;
    ALTER ROLE db_owner ADD MEMBER qcs_admin;
END
GO