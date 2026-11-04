import type { TicketStatus } from './ticket.model';

const NEXT: Readonly<Record<string, readonly TicketStatus[]>> = {
  CREATED: ['IN_REVIEW'],
  REOPENED: ['IN_REVIEW'],
  IN_REVIEW: ['RETURNED', 'RESOLVED', 'DERIVED'],
};

export const nextStatuses = (current: TicketStatus): readonly TicketStatus[] => NEXT[current] ?? [];

export const statusNeedsComment = (status: string): boolean =>
  status === 'DERIVED' || status === 'RESOLVED' || status === 'RETURNED';

export const statusNeedsAssignee = (status: string): boolean => status === 'DERIVED';
