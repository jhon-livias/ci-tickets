import type { Ticket, TicketKind, TicketPriority, TicketStatus } from '../models/ticket.model';
import { PRIORITY_LABELS, STATUS_LABELS } from '../models/ticket-labels';

export interface TicketQuery {
  readonly from: string;
  readonly to: string;
  readonly status: string;
  readonly code: string;
  readonly requester: string;
  readonly priority: string;
  readonly kind: string;
  readonly collaborator: string;
  readonly search: string;
}

export const emptyQuery = (): TicketQuery => ({
  from: '',
  to: '',
  status: '',
  code: '',
  requester: '',
  priority: '',
  kind: '',
  collaborator: '',
  search: '',
});

export const filterTickets = (tickets: readonly Ticket[], query: TicketQuery, academicArea = ''): readonly Ticket[] =>
  tickets.filter((ticket) => {
    const day = ticket.createdAt.slice(0, 10);
    if (query.from && day < query.from) return false;
    if (query.to && day > query.to) return false;
    if (query.status && ticket.status !== query.status) return false;
    if (query.code && !ticket.code.toLocaleLowerCase('es').includes(query.code.trim().toLocaleLowerCase('es'))) return false;
    if (query.requester && !ticket.requesterName.toLocaleLowerCase('es').includes(query.requester.trim().toLocaleLowerCase('es'))) return false;
    if (query.priority && ticket.priority !== query.priority) return false;
    if (query.kind === 'EXTERNAL' && ticket.kind !== 'EXTERNAL') return false;
    if (query.kind === 'INTERNAL' && ticket.kind !== 'INTERNAL') return false;
    if (query.collaborator && ticket.assignedName !== query.collaborator) return false;
    if (query.search) {
      const blob = `${ticket.code} ${ticket.requesterName} ${ticket.categoryName}`.toLocaleLowerCase('es');
      if (!blob.includes(query.search.trim().toLocaleLowerCase('es'))) return false;
    }
    if (academicArea && ticket.academicArea && ticket.academicArea !== academicArea) return false;
    return true;
  }).slice()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

export const statusOptions = (values: readonly TicketStatus[]) =>
  [{ value: '', label: 'Todos' }, ...values.map((value) => ({ value, label: STATUS_LABELS[value] }))];

export const priorityOptions = (values: readonly TicketPriority[] = ['HIGH', 'MEDIUM', 'LOW']) =>
  [{ value: '', label: 'Todas' }, ...values.map((value) => ({ value, label: PRIORITY_LABELS[value] }))];

export const kindOptions = (values: readonly { value: TicketKind | ''; label: string }[]) => values;
