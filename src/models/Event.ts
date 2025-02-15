import { z } from 'zod';
import { executeQuery } from '../utils/database';

// Define the event status and risk level types
export type EventStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type RiskLevel = 'low' | 'medium' | 'high';

// Define the Event interfaces
export interface EventAttributes {
  id?: number;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  type: string;
  status: EventStatus;
  qualityRequirements: string;
  riskLevel: RiskLevel;
  requiredInspections: string;
  createdById: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Event model
class Event {
  public id?: number;
  public title: string;
  public description: string;
  public startDate: Date;
  public endDate: Date;
  public location: string;
  public type: string;
  public status: EventStatus;
  public qualityRequirements: string;
  public riskLevel: RiskLevel;
  public requiredInspections: string;
  public createdById: number;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(attributes: EventAttributes) {
    this.id = attributes.id;
    this.title = attributes.title;
    this.description = attributes.description;
    this.startDate = attributes.startDate;
    this.endDate = attributes.endDate;
    this.location = attributes.location;
    this.type = attributes.type;
    this.status = attributes.status;
    this.qualityRequirements = attributes.qualityRequirements;
    this.riskLevel = attributes.riskLevel;
    this.requiredInspections = attributes.requiredInspections;
    this.createdById = attributes.createdById;
    this.createdAt = attributes.createdAt;
    this.updatedAt = attributes.updatedAt;
  }

  static create(attributes: EventAttributes): Event {
    return new Event(attributes);
  }

  // Add a static method for input validation using Zod
  static validate = z.object({
    title: z.string().min(1).max(200),
    description: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    location: z.string().min(1).max(200),
    type: z.string().min(1).max(50),
    status: z.enum(['draft', 'scheduled', 'in_progress', 'completed', 'cancelled']),
    qualityRequirements: z.string(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    requiredInspections: z.string(),
    createdById: z.number()
  }).refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date"
  });
}

// Database Operations

export async function createEvent(event: EventAttributes): Promise<Event> {
  const result = await executeQuery<EventAttributes>(
    `INSERT INTO Events (
      Title, Description, StartDate, EndDate, Location, Type, Status,
      QualityRequirements, RiskLevel, RequiredInspections, CreatedById,
      CreatedAt, UpdatedAt
    )
    OUTPUT INSERTED.*
    VALUES (
      @title, @description, @startDate, @endDate, @location, @type, @status,
      @qualityRequirements, @riskLevel, @requiredInspections, @createdById,
      GETUTCDATE(), GETUTCDATE()
    )`,
    {
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      type: event.type,
      status: event.status,
      qualityRequirements: event.qualityRequirements,
      riskLevel: event.riskLevel,
      requiredInspections: event.requiredInspections,
      createdById: event.createdById
    }
  );
  return Event.create(result[0]);
}

export async function getEventById(id: number): Promise<Event | undefined> {
  const result = await executeQuery<EventAttributes>(
    'SELECT * FROM Events WHERE Id = @id',
    { id }
  );
  return result[0] ? Event.create(result[0]) : undefined;
}

export async function updateEvent(id: number, event: Partial<EventAttributes>): Promise<Event | undefined> {
  const updates = Object.entries(event)
    .map(([key, _]) => `${key} = @${key}`)
    .join(', ');

  const result = await executeQuery<EventAttributes>(
    `UPDATE Events
     SET ${updates}, UpdatedAt = GETUTCDATE()
     OUTPUT INSERTED.*
     WHERE Id = @id`,
    { ...event, id }
  );
  return result[0] ? Event.create(result[0]) : undefined;
}

export async function deleteEvent(id: number): Promise<boolean> {
  try {
    const result = await executeQuery<{ rowsAffected?: number[] }>(
      'DELETE FROM Events WHERE Id = @id',
      { id }
    );
    return (result?.rowsAffected?.[0] ?? 0) > 0;
  } catch (error) {
    console.error('Error deleting event:', error);
    return false;
  }
}

export async function getEventWithCreator(id: number): Promise<EventWithCreator | undefined> {
  const result = await executeQuery<EventWithCreator>(
    `SELECT e.*, u.FirstName + ' ' + u.LastName as CreatedByName
     FROM Events e
     LEFT JOIN Users u ON e.CreatedById = u.Id
     WHERE e.Id = @id`,
    { id }
  );
  return result[0];
}

export async function getEventWithMetrics(id: number): Promise<EventWithMetrics | undefined> {
  const result = await executeQuery<EventWithMetrics>(
    `SELECT e.*, u.FirstName + ' ' + u.LastName as CreatedByName,
            (SELECT COUNT(*) FROM EventInspections WHERE EventId = @id) as InspectionsCount,
            (SELECT COUNT(*) FROM EventInspections WHERE EventId = @id AND Status = 'completed') as CompletedInspectionsCount
     FROM Events e
     LEFT JOIN Users u ON e.CreatedById = u.Id
     WHERE e.Id = @id`,
    { id }
  );
  return result[0];
}

export async function getEventMetrics(startDate?: Date, endDate?: Date): Promise<EventMetrics> {
  const result = await executeQuery<EventMetrics>(
    `SELECT
       COUNT(*) as TotalEvents,
       SUM(CASE WHEN Status = 'completed' THEN 1 ELSE 0 END) as CompletedEvents,
       SUM(CASE WHEN Status = 'in_progress' THEN 1 ELSE 0 END) as InProgressEvents,
       AVG(CASE WHEN Status = 'completed' THEN 
         (SELECT COUNT(*) FROM EventInspections WHERE EventId = Events.Id AND Status = 'completed') * 100.0 /
         NULLIF((SELECT COUNT(*) FROM EventInspections WHERE EventId = Events.Id), 0)
       ELSE NULL END) as AvgInspectionCompletionRate,
       COUNT(DISTINCT CASE WHEN RiskLevel = 'high' THEN Id END) as HighRiskEvents
     FROM Events
     WHERE (@startDate IS NULL OR StartDate >= @startDate)
       AND (@endDate IS NULL OR EndDate <= @endDate)`,
    { startDate, endDate }
  );
  return result[0];
}

export async function addEventInspection(inspection: Omit<EventInspection, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<EventInspection> {
  const result = await executeQuery<EventInspection>(
    `INSERT INTO EventInspections (
       EventId, Type, Description, AssignedTo,
       Status, DueDate, CreatedById, CreatedAt, UpdatedAt
     )
     OUTPUT INSERTED.*
     VALUES (
       @eventId, @type, @description, @assignedTo,
       'pending', @dueDate, @createdById, GETUTCDATE(), GETUTCDATE()
     )`,
    inspection
  );
  return result[0];
}

export async function cancelEvent(id: number): Promise<boolean> {
  const result = await executeQuery<{ rowsAffected?: number[] }>(
    `UPDATE Events 
     SET Status = 'cancelled', UpdatedAt = GETUTCDATE() 
     WHERE Id = @id`,
    { id }
  );
  return (result?.rowsAffected?.[0] ?? 0) > 0;
}

export async function listEvents(
  options: {
    status?: EventStatus;
    startDate?: Date;
    endDate?: Date;
    createdById?: number;
    riskLevel?: RiskLevel;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ events: Event[]; total: number }> {
  let whereClause = '1=1';
  const params: any = {};

  if (options.status) {
    whereClause += ' AND Status = @status';
    params.status = options.status;
  }
  if (options.startDate) {
    whereClause += ' AND StartDate >= @startDate';
    params.startDate = options.startDate;
  }
  if (options.endDate) {
    whereClause += ' AND EndDate <= @endDate';
    params.endDate = options.endDate;
  }
  if (options.createdById) {
    whereClause += ' AND CreatedById = @createdById';
    params.createdById = options.createdById;
  }
  if (options.riskLevel) {
    whereClause += ' AND RiskLevel = @riskLevel';
    params.riskLevel = options.riskLevel;
  }

  const limit = options.limit || 10;
  const offset = options.offset || 0;
  params.limit = limit;
  params.offset = offset;

  const countResult = await executeQuery<{ total: number }>(
    `SELECT COUNT(*) as total FROM Events WHERE ${whereClause}`,
    params
  );

  const results = await executeQuery<EventAttributes>(
    `SELECT * FROM Events 
     WHERE ${whereClause}
     ORDER BY CreatedAt DESC
     OFFSET @offset ROWS
     FETCH NEXT @limit ROWS ONLY`,
    params
  );

  return {
    events: results.map(result => Event.create(result)),
    total: countResult[0].total
  };
}

// Extended Event Types
export interface EventWithCreator extends EventAttributes {
  createdByName: string;
}

export interface EventMetrics {
  totalEvents: number;
  completedEvents: number;
  inProgressEvents: number;
  avgInspectionCompletionRate: number;
  highRiskEvents: number;
}

export interface EventWithMetrics extends EventWithCreator {
  inspectionsCount: number;
  completedInspectionsCount: number;
}

export interface CountResult {
  count: number;
}

export interface EventInspection {
  id: number;
  eventId: number;
  type: string;
  description: string;
  assignedTo: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dueDate: Date;
  completedAt?: Date;
  notes?: string;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
}

export default Event;
