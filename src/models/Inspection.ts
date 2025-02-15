import { z } from 'zod';
import { executeQuery } from '../utils/database';

// Define the inspection status type
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Define the Inspection attributes interface
export interface InspectionAttributes {
  id?: number;
  eventId: number;
  type: string;
  description: string;
  assignedTo: number;
  status: InspectionStatus;
  dueDate: Date;
  completedAt?: Date | null;
  notes?: string | null;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Inspection model
class Inspection {
  public id?: number;
  public eventId: number;
  public type: string;
  public description: string;
  public assignedTo: number;
  public status: InspectionStatus;
  public dueDate: Date;
  public completedAt?: Date | null;
  public notes?: string | null;
  public createdById: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(attributes: InspectionAttributes) {
    this.id = attributes.id;
    this.eventId = attributes.eventId;
    this.type = attributes.type;
    this.description = attributes.description;
    this.assignedTo = attributes.assignedTo;
    this.status = attributes.status;
    this.dueDate = attributes.dueDate;
    this.completedAt = attributes.completedAt;
    this.notes = attributes.notes;
    this.createdById = attributes.createdById;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  static create(attributes: InspectionAttributes): Inspection {
    return new Inspection(attributes);
  }

  // Add a static method for input validation using Zod
  static validate = z.object({
    eventId: z.number().positive(),
    type: z.string().min(1).max(50),
    description: z.string().min(1),
    assignedTo: z.number().positive(),
    status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
    dueDate: z.date(),
    notes: z.string().nullable().optional(),
    createdById: z.number().positive()
  });

  // Status transition validation
  static validateStatusTransition(currentStatus: InspectionStatus, newStatus: InspectionStatus): boolean {
    const validTransitions: Record<InspectionStatus, InspectionStatus[]> = {
      pending: ['in_progress'],
      in_progress: ['completed', 'failed'],
      completed: [],
      failed: ['in_progress']
    };
    return validTransitions[currentStatus].includes(newStatus);
  }
}

// Database Operations

export async function createInspection(inspection: InspectionAttributes): Promise<Inspection> {
  const result = await executeQuery<InspectionAttributes>(
    `INSERT INTO EventInspections (
      EventId, Type, Description, AssignedTo,
      Status, DueDate, Notes, CreatedById,
      CreatedAt, UpdatedAt
    )
    OUTPUT INSERTED.*
    VALUES (
      @eventId, @type, @description, @assignedTo,
      @status, @dueDate, @notes, @createdById,
      GETUTCDATE(), GETUTCDATE()
    )`,
    {
      eventId: inspection.eventId,
      type: inspection.type,
      description: inspection.description,
      assignedTo: inspection.assignedTo,
      status: inspection.status,
      dueDate: inspection.dueDate,
      notes: inspection.notes,
      createdById: inspection.createdById
    }
  );
  return Inspection.create(result[0]);
}

export async function getInspectionById(eventId: number, id: number): Promise<Inspection | undefined> {
  const result = await executeQuery<InspectionAttributes>(
    'SELECT * FROM EventInspections WHERE EventId = @eventId AND Id = @id',
    { eventId, id }
  );
  return result[0] ? Inspection.create(result[0]) : undefined;
}

export interface InspectionWithUser extends InspectionAttributes {
  assignedUserName: string;
  createdByName: string;
  assignedUserEmail?: string;
  createdByEmail?: string;
}

export async function getInspectionWithDetails(eventId: number, id: number): Promise<InspectionWithUser | undefined> {
  const result = await executeQuery<InspectionWithUser>(
    `SELECT i.*, 
      CONCAT(u1.FirstName, ' ', u1.LastName) as AssignedUserName,
      CONCAT(u2.FirstName, ' ', u2.LastName) as CreatedByName,
      u1.Email as AssignedUserEmail,
      u2.Email as CreatedByEmail
    FROM EventInspections i
    LEFT JOIN Users u1 ON i.AssignedTo = u1.Id
    LEFT JOIN Users u2 ON i.CreatedById = u2.Id
    WHERE i.EventId = @eventId AND i.Id = @id`,
    { eventId, id }
  );
  return result[0];
}

export async function updateInspection(
  eventId: number,
  id: number,
  updates: Partial<InspectionAttributes>
): Promise<Inspection | undefined> {
  const updateFields = Object.entries(updates)
    .map(([key, _]) => `${key} = @${key}`)
    .join(', ');

  const result = await executeQuery<InspectionAttributes>(
    `UPDATE EventInspections
     SET ${updateFields}, UpdatedAt = GETUTCDATE()
     OUTPUT INSERTED.*
     WHERE EventId = @eventId AND Id = @id`,
    { ...updates, eventId, id }
  );
  return result[0] ? Inspection.create(result[0]) : undefined;
}

export async function updateInspectionStatus(
  eventId: number,
  id: number,
  status: InspectionStatus
): Promise<Inspection | undefined> {
  const result = await executeQuery<InspectionAttributes>(
    `UPDATE EventInspections
     SET Status = @status,
         CompletedAt = ${status === 'completed' ? 'GETUTCDATE()' : 'NULL'},
         UpdatedAt = GETUTCDATE()
     OUTPUT INSERTED.*
     WHERE EventId = @eventId AND Id = @id`,
    { eventId, id, status }
  );
  return result[0] ? Inspection.create(result[0]) : undefined;
}

export interface InspectionMetrics {
  totalInspections: number;
  completedInspections: number;
  failedInspections: number;
  inProgressInspections: number;
  pendingInspections: number;
  overdueInspections: number;
  avgCompletionTimeHours: number | null;
}

export async function getInspectionMetrics(eventId: number): Promise<InspectionMetrics> {
  const result = await executeQuery<InspectionMetrics>(
    `SELECT
      COUNT(*) as TotalInspections,
      SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as CompletedInspections,
      SUM(CASE WHEN Status = 'failed' THEN 1 ELSE 0 END) as FailedInspections,
      SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as InProgressInspections,
      SUM(CASE WHEN Status = 'pending' THEN 1 ELSE 0 END) as PendingInspections,
      SUM(CASE WHEN DueDate < GETUTCDATE() AND Status NOT IN ('completed', 'failed') THEN 1 ELSE 0 END) as OverdueInspections,
      AVG(CASE 
        WHEN Status = 'completed' 
        THEN DATEDIFF(hour, CreatedAt, CompletedAt) 
        ELSE NULL 
      END) as AvgCompletionTimeHours
    FROM EventInspections
    WHERE EventId = @eventId`,
    { eventId }
  );
  return result[0];
}

export async function listInspections(
  eventId: number,
  options: {
    status?: InspectionStatus;
    assignedTo?: number;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ inspections: InspectionWithUser[]; total: number }> {
  let whereClause = 'EventId = @eventId';
  const params: any = { eventId };

  if (options.status) {
    whereClause += ' AND Status = @status';
    params.status = options.status;
  }
  if (options.assignedTo) {
    whereClause += ' AND AssignedTo = @assignedTo';
    params.assignedTo = options.assignedTo;
  }

  const limit = options.limit || 10;
  const offset = options.offset || 0;
  params.limit = limit;
  params.offset = offset;

  const countResult = await executeQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM EventInspections WHERE ${whereClause}`,
    params
  );

  const inspections = await executeQuery<InspectionWithUser>(
    `SELECT i.*, 
      CONCAT(u1.FirstName, ' ', u1.LastName) as AssignedUserName,
      CONCAT(u2.FirstName, ' ', u2.LastName) as CreatedByName
    FROM EventInspections i
    LEFT JOIN Users u1 ON i.AssignedTo = u1.Id
    LEFT JOIN Users u2 ON i.CreatedById = u2.Id
    WHERE ${whereClause}
    ORDER BY i.DueDate ASC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY`,
    params
  );

  return {
    inspections,
    total: countResult[0].total
  };
}

export default Inspection;
