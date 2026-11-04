import type { UiTableRow } from '../../../shared/ui/table/ui-table.component';
import { KIND_LABELS, PRIORITY_LABELS, STATUS_LABELS, formatDate, formatDateTime } from '../models/ticket-labels';
import type { Ticket } from '../models/ticket.model';

export const toTicketRow = (ticket: Ticket): UiTableRow => ({
  id: ticket.id,
  code: ticket.code,
  createdAt: formatDateTime(ticket.createdAt),
  about: ticket.aboutLabel,
  requester: ticket.requesterName,
  affectedDni: (ticket.about ?? 'SELF') === 'SELF' ? '' : ticket.affectedDocument,
  role: ticket.requesterRole,
  category: ticket.categoryName,
  status: STATUS_LABELS[ticket.status],
  estimate: ticket.estimate,
  priority: PRIORITY_LABELS[ticket.priority],
  assigned: ticket.assignedName ?? '—',
  kind: KIND_LABELS[ticket.kind],
  dueOn: formatDate(ticket.dueOn),
  movementAt: formatDateTime(ticket.history.at(-1)?.at ?? ticket.createdAt),
  resolvedAt: formatDateTime(ticket.resolvedAt ?? ticket.history.at(-1)?.at ?? ticket.createdAt),
});

export const rowId = (row: UiTableRow): string => String(row['id'] ?? '');
