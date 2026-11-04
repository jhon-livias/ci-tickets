import type { TicketsListConfig } from './tickets-list.page';

export const assistantQueue: TicketsListConfig = {
  title: 'Cola de tickets',
  description: 'Tickets activos, ordenados del más reciente al más antiguo.',
  statuses: ['CREATED', 'IN_REVIEW', 'REOPENED'],
  kind: 'ALL',
  defaultKind: 'EXTERNAL',
  showCollaborator: false,
  showDue: false,
  showKindFilter: true,
  mode: 'status',
  dateDefault: 'none',
};

export const assistantInternal: TicketsListConfig = {
  title: 'Tickets internos',
  description: 'Solicitudes internas emitidas por superiores autorizados.',
  statuses: ['CREATED', 'IN_REVIEW'],
  kind: 'INTERNAL',
  defaultKind: 'INTERNAL',
  showCollaborator: false,
  showDue: true,
  showKindFilter: false,
  mode: 'status',
  dateDefault: 'pending',
};

export const assistantClosed: TicketsListConfig = {
  title: 'Tickets cerrados',
  description: 'Tickets que salieron de la cola activa: resueltos, derivados y devueltos.',
  statuses: ['RESOLVED', 'DERIVED', 'RETURNED'],
  kind: 'ALL',
  defaultKind: '',
  showCollaborator: false,
  showDue: false,
  showKindFilter: true,
  mode: 'readonly',
  dateDefault: 'none',
};

export const managerQueue: TicketsListConfig = {
  title: 'Cola de tickets',
  description: 'Tickets recibidos activos, ordenados del más reciente al más antiguo.',
  statuses: ['CREATED', 'IN_REVIEW', 'DERIVED', 'RETURNED'],
  kind: 'EXTERNAL',
  defaultKind: 'EXTERNAL',
  showCollaborator: true,
  showDue: false,
  showKindFilter: false,
  mode: 'status',
  dateDefault: 'none',
};

export const managerHistory: TicketsListConfig = {
  title: 'Tickets cerrados',
  description: 'Tickets resueltos y fecha de cierre.',
  statuses: ['RESOLVED'],
  kind: 'EXTERNAL',
  defaultKind: 'EXTERNAL',
  showCollaborator: true,
  showDue: false,
  showKindFilter: false,
  mode: 'readonly',
  dateDefault: 'none',
};
