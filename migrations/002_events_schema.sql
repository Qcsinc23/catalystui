-- Events table
CREATE TABLE Events (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    Location NVARCHAR(200) NOT NULL,
    Type NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    QualityRequirements NVARCHAR(MAX) NOT NULL,
    RiskLevel NVARCHAR(10) NOT NULL CHECK (RiskLevel IN ('low', 'medium', 'high')),
    RequiredInspections NVARCHAR(MAX) NOT NULL,
    CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT CHK_EventDates CHECK (EndDate > StartDate)
);

-- Event Inspections table
CREATE TABLE EventInspections (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL FOREIGN KEY REFERENCES Events(Id),
    Type NVARCHAR(50) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    AssignedTo INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('pending', 'in_progress', 'completed', 'failed')),
    DueDate DATETIME2 NOT NULL,
    CompletedAt DATETIME2 NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Event Quality Issues table
CREATE TABLE EventQualityIssues (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL FOREIGN KEY REFERENCES Events(Id),
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Severity NVARCHAR(10) NOT NULL CHECK (Severity IN ('low', 'medium', 'high', 'critical')),
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('open', 'in_progress', 'resolved', 'closed')),
    AssignedTo INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    ResolutionNotes NVARCHAR(MAX) NULL,
    ResolvedAt DATETIME2 NULL,
    CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Event Attachments table
CREATE TABLE EventAttachments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL FOREIGN KEY REFERENCES Events(Id),
    FileName NVARCHAR(255) NOT NULL,
    FileType NVARCHAR(100) NOT NULL,
    FileSize BIGINT NOT NULL,
    StoragePath NVARCHAR(500) NOT NULL,
    Category NVARCHAR(50) NOT NULL CHECK (Category IN ('document', 'image', 'report', 'other')),
    Description NVARCHAR(500) NULL,
    UploadedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Event Comments table
CREATE TABLE EventComments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EventId INT NOT NULL FOREIGN KEY REFERENCES Events(Id),
    Comment NVARCHAR(MAX) NOT NULL,
    CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Indexes
CREATE INDEX IX_Events_Status ON Events(Status);
CREATE INDEX IX_Events_StartDate ON Events(StartDate);
CREATE INDEX IX_Events_CreatedById ON Events(CreatedById);
CREATE INDEX IX_Events_RiskLevel ON Events(RiskLevel);

CREATE INDEX IX_EventInspections_EventId ON EventInspections(EventId);
CREATE INDEX IX_EventInspections_Status ON EventInspections(Status);
CREATE INDEX IX_EventInspections_AssignedTo ON EventInspections(AssignedTo);
CREATE INDEX IX_EventInspections_DueDate ON EventInspections(DueDate);

CREATE INDEX IX_EventQualityIssues_EventId ON EventQualityIssues(EventId);
CREATE INDEX IX_EventQualityIssues_Status ON EventQualityIssues(Status);
CREATE INDEX IX_EventQualityIssues_Severity ON EventQualityIssues(Severity);
CREATE INDEX IX_EventQualityIssues_AssignedTo ON EventQualityIssues(AssignedTo);

CREATE INDEX IX_EventAttachments_EventId ON EventAttachments(EventId);
CREATE INDEX IX_EventAttachments_Category ON EventAttachments(Category);

CREATE INDEX IX_EventComments_EventId ON EventComments(EventId);
CREATE INDEX IX_EventComments_CreatedAt ON EventComments(CreatedAt);