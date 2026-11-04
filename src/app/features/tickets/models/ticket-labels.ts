import type { TicketHistoryEntry, TicketKind, TicketPriority, TicketStatus } from './ticket.model';

export const STATUS_LABELS: Record<TicketStatus, string> = {
  CREATED: 'Creado',
  IN_REVIEW: 'En revisión',
  RETURNED: 'Devuelto',
  RESOLVED: 'Resuelto',
  DERIVED: 'Derivado',
  REOPENED: 'Reaperturado',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Media',
  LOW: 'Baja',
};

export const KIND_LABELS: Record<TicketKind, string> = {
  EXTERNAL: 'Externo',
  INTERNAL: 'Interno',
};

export const ACTIVE_EXTERNAL_STATUSES: readonly TicketStatus[] = ['CREATED', 'IN_REVIEW', 'REOPENED'];
export const CLOSED_EXTERNAL_STATUSES: readonly TicketStatus[] = ['RESOLVED', 'DERIVED', 'RETURNED'];
export const ACTIVE_INTERNAL_STATUSES: readonly TicketStatus[] = ['CREATED', 'IN_REVIEW'];

export const isoDate = (value: Date = new Date()): string => {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
};

export const monthStart = (value: Date = new Date()): string =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-01`;

export const weekBounds = (value: Date = new Date()): { readonly from: string; readonly to: string } => {
  const day = value.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(value);
  monday.setDate(value.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: isoDate(monday), to: isoDate(sunday) };
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString('es-PE')} ${date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`;
};

export const historyCaption = (entry: TicketHistoryEntry): string => {
  if (entry.status === 'IN_REVIEW') return `por ${entry.actorName}`;
  if (entry.status === 'DERIVED' && entry.fromName && entry.toName) return `de ${entry.fromName} a ${entry.toName}`;
  if (entry.status === 'DERIVED') return `por ${entry.actorName}`;
  if (entry.status === 'RESOLVED') return `por ${entry.actorName}`;
  if (entry.status === 'RETURNED') return `por ${entry.actorName}`;
  if (entry.status === 'REOPENED') return `por ${entry.actorName}`;
  return `${entry.actorName} · ${entry.actorArea}`;
};

export const formatDate = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-PE');
};

export const businessDaysBetween = (fromIso: string, toDate: Date): number => {
  const cursor = new Date(fromIso);
  if (Number.isNaN(cursor.getTime())) return 0;
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(toDate);
  last.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);
  let count = 0;
  while (cursor <= last) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

export const canReopenTicket = (resolvedAt: string | null, status: TicketStatus, now: Date = new Date()): boolean =>
  status === 'RESOLVED' && resolvedAt !== null && businessDaysBetween(resolvedAt, now) <= 5;

export const nextTicketCode = (areaCode: string, existing: readonly string[], at: Date): string => {
  const prefix = `${areaCode}${String(at.getFullYear()).slice(-2)}${String(at.getMonth() + 1).padStart(2, '0')}`;
  const used = existing
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number(code.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
};
