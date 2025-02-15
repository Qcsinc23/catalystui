-- Drop existing comments table and its indexes
DROP INDEX IX_EventComments_EventId ON EventComments;
DROP INDEX IX_EventComments_CreatedAt ON EventComments;
DROP TABLE EventComments;

-- Create new Comments table with enhanced functionality
CREATE TABLE Comments (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    EntityType NVARCHAR(20) NOT NULL CHECK (EntityType IN ('event', 'inspection')),
    EntityId INT NOT NULL,
    Content NVARCHAR(MAX) NOT NULL,
    ParentId INT NULL FOREIGN KEY REFERENCES Comments(Id),
    CreatedById INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    -- Ensure EntityId references the correct table based on EntityType
    CONSTRAINT CHK_Comments_EntityReference CHECK (
        (EntityType = 'event' AND EXISTS(SELECT 1 FROM Events WHERE Id = EntityId))
        OR
        (EntityType = 'inspection' AND EXISTS(SELECT 1 FROM EventInspections WHERE Id = EntityId))
    )
);

-- Create indexes for performance
CREATE INDEX IX_Comments_EntityType_EntityId ON Comments(EntityType, EntityId);
CREATE INDEX IX_Comments_ParentId ON Comments(ParentId);
CREATE INDEX IX_Comments_CreatedById ON Comments(CreatedById);
CREATE INDEX IX_Comments_CreatedAt ON Comments(CreatedAt);