export type TicketStatus = 'CREATED' | 'IN_REVIEW' | 'RETURNED' | 'RESOLVED' | 'DERIVED' | 'REOPENED';
export type TicketKind = 'EXTERNAL' | 'INTERNAL';
export type TicketPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TicketsRole = 'requester' | 'assistant' | 'area_manager' | 'admin';

export interface TicketHistoryEntry {
  readonly status: TicketStatus;
  readonly at: string;
  readonly actorName: string;
  readonly actorArea: string;
  readonly fromName?: string;
  readonly toName?: string;
}

export interface Ticket {
  readonly id: string;
  readonly code: string;
  readonly kind: TicketKind;
  readonly createdAt: string;
  readonly academicArea: string;
  readonly aboutLabel: string;
  readonly categoryName: string;
  readonly status: TicketStatus;
  readonly estimate: string;
  readonly priority: TicketPriority;
  readonly requesterName: string;
  readonly requesterRole: string;
  readonly assignedName: string | null;
  readonly dueOn: string | null;
  readonly description: string;
  readonly receiverResponse: string;
  readonly resolvedAt: string | null;
  readonly attachmentNames: readonly string[];
  readonly history: readonly TicketHistoryEntry[];
  readonly destinationAreaCode: string;
  readonly emittedInternally: boolean;
}

export interface TicketCategory {
  readonly id: string;
  readonly areaId: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
}

export interface ServiceArea {
  readonly id: string;
  readonly parentId: string | null;
  readonly code: string;
  readonly name: string;
  readonly responsibility: string;
  readonly managerName: string;
  readonly managerDocument: string;
  readonly managerEmail: string;
  readonly receivesTickets: boolean;
  readonly allowsInternal: boolean;
  readonly canCreateTickets: boolean;
  readonly enabled: boolean;
}

export interface TeamMember {
  readonly id: string;
  readonly fullName: string;
  readonly document: string;
  readonly roleTitle: string;
  readonly email: string;
  readonly phone: string;
  readonly functions: string;
  readonly schedule: string;
  readonly isManager: boolean;
}

export interface PriorityActivity {
  readonly id?: string;
  readonly categoryName: string;
  readonly activity: string;
  readonly estimate: string;
}

export interface PriorityLevel {
  readonly level: TicketPriority;
  readonly description: string;
  readonly activities: readonly PriorityActivity[];
}

export interface CreateExternalTicketInput {
  readonly areaId: string;
  readonly about: 'self' | 'student' | 'teacher';
  readonly otherName: string;
  readonly otherDocument: string;
  readonly categoryId: string;
  readonly description: string;
  readonly attachmentNames: readonly string[];
}

export interface CreateInternalTicketInput {
  readonly assignedName: string;
  readonly dueOn: string;
  readonly priority: TicketPriority;
  readonly categoryName: string;
  readonly description: string;
  readonly attachmentNames: readonly string[];
}
