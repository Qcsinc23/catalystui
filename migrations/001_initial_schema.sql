-- Initial Schema for QCS Management System

-- Users Table
CREATE TABLE [dbo].[Users] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Email] NVARCHAR(255) NOT NULL UNIQUE,
    [PasswordHash] NVARCHAR(MAX) NOT NULL,
    [FirstName] NVARCHAR(100) NOT NULL,
    [LastName] NVARCHAR(100) NOT NULL,
    [Role] NVARCHAR(20) NOT NULL CHECK (Role IN ('admin', 'manager', 'staff')),
    [IsActive] BIT NOT NULL DEFAULT 1,
    [LastLogin] DATETIME2 NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Events Table
CREATE TABLE [dbo].[Events] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [StartDate] DATETIME2 NOT NULL,
    [EndDate] DATETIME2 NOT NULL,
    [Location] NVARCHAR(255) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL CHECK (Status IN ('draft', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    [Type] NVARCHAR(20) NOT NULL CHECK (Type IN ('conference', 'meeting', 'wedding', 'party', 'exhibition', 'other')),
    [ExpectedAttendees] INT NOT NULL DEFAULT 0,
    [Budget] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedById] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [UpdatedById] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CHECK (EndDate >= StartDate)
);
GO

-- Inventory Items Table
CREATE TABLE [dbo].[InventoryItems] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Name] NVARCHAR(255) NOT NULL,
    [Description] NVARCHAR(MAX) NULL,
    [Category] NVARCHAR(20) NOT NULL CHECK (Category IN ('furniture', 'electronics', 'decor', 'lighting', 'audio', 'video', 'linens', 'tableware', 'other')),
    [SKU] NVARCHAR(50) NOT NULL UNIQUE,
    [Quantity] INT NOT NULL DEFAULT 0,
    [MinQuantity] INT NOT NULL DEFAULT 0,
    [UnitPrice] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [Location] NVARCHAR(255) NOT NULL,
    [Supplier] NVARCHAR(255) NULL,
    [Notes] NVARCHAR(MAX) NULL,
    [IsActive] BIT NOT NULL DEFAULT 1,
    [CreatedById] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [UpdatedById] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CHECK (Quantity >= 0),
    CHECK (MinQuantity >= 0),
    CHECK (UnitPrice >= 0)
);
GO

-- Event Inventory Items (Junction Table)
CREATE TABLE [dbo].[EventInventoryItems] (
    [EventId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Events](Id),
    [InventoryItemId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[InventoryItems](Id),
    [Quantity] INT NOT NULL DEFAULT 0,
    [Notes] NVARCHAR(MAX) NULL,
    PRIMARY KEY ([EventId], [InventoryItemId]),
    CHECK (Quantity > 0)
);
GO

-- Stock Movement History
CREATE TABLE [dbo].[StockMovements] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [InventoryItemId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[InventoryItems](Id),
    [Type] NVARCHAR(20) NOT NULL CHECK (Type IN ('purchase', 'sale', 'event_allocation', 'event_return', 'adjustment', 'damage')),
    [Quantity] INT NOT NULL,
    [PreviousQuantity] INT NOT NULL,
    [NewQuantity] INT NOT NULL,
    [EventId] INT NULL FOREIGN KEY REFERENCES [dbo].[Events](Id),
    [Notes] NVARCHAR(MAX) NULL,
    [CreatedById] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Refresh Tokens Table
CREATE TABLE [dbo].[RefreshTokens] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UserId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [Token] NVARCHAR(MAX) NOT NULL,
    [ExpiresAt] DATETIME2 NOT NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [RevokedAt] DATETIME2 NULL
);
GO

-- Audit Log Table
CREATE TABLE [dbo].[AuditLogs] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [EntityType] NVARCHAR(50) NOT NULL,
    [EntityId] INT NOT NULL,
    [Action] NVARCHAR(20) NOT NULL CHECK (Action IN ('create', 'update', 'delete')),
    [Changes] NVARCHAR(MAX) NOT NULL,
    [UserId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Users](Id),
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Indexes
CREATE INDEX [IX_Users_Email] ON [dbo].[Users]([Email]);
CREATE INDEX [IX_Events_StartDate] ON [dbo].[Events]([StartDate]);
CREATE INDEX [IX_Events_Status] ON [dbo].[Events]([Status]);
CREATE INDEX [IX_InventoryItems_SKU] ON [dbo].[InventoryItems]([SKU]);
CREATE INDEX [IX_InventoryItems_Category] ON [dbo].[InventoryItems]([Category]);
CREATE INDEX [IX_StockMovements_InventoryItemId] ON [dbo].[StockMovements]([InventoryItemId]);
CREATE INDEX [IX_RefreshTokens_UserId] ON [dbo].[RefreshTokens]([UserId]);
CREATE INDEX [IX_AuditLogs_EntityType_EntityId] ON [dbo].[AuditLogs]([EntityType], [EntityId]);
GO

-- Triggers for UpdatedAt
CREATE TRIGGER [TR_Users_UpdatedAt] ON [dbo].[Users]
AFTER UPDATE AS
BEGIN
    UPDATE [dbo].[Users]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [dbo].[Users] u
    INNER JOIN inserted i ON u.Id = i.Id;
END;
GO

CREATE TRIGGER [TR_Events_UpdatedAt] ON [dbo].[Events]
AFTER UPDATE AS
BEGIN
    UPDATE [dbo].[Events]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [dbo].[Events] e
    INNER JOIN inserted i ON e.Id = i.Id;
END;
GO

CREATE TRIGGER [TR_InventoryItems_UpdatedAt] ON [dbo].[InventoryItems]
AFTER UPDATE AS
BEGIN
    UPDATE [dbo].[InventoryItems]
    SET [UpdatedAt] = GETUTCDATE()
    FROM [dbo].[InventoryItems] i
    INNER JOIN inserted ins ON i.Id = ins.Id;
END;