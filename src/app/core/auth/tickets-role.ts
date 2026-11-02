import type { TicketsRole } from '../../features/tickets/models/ticket.model';
import type { TicketsUser } from './tickets-auth.service';

const ROLE_RANK: readonly TicketsRole[] = ['admin', 'area_manager', 'assistant', 'requester'];

const USERNAME_FALLBACK: Readonly<Record<string, TicketsRole>> = {
  administrador: 'admin',
  'jefe-area': 'area_manager',
  asistente: 'assistant',
  solicitante: 'requester',
  rmedina: 'admin',
  lcastillo: 'area_manager',
  storres: 'assistant',
  aramirez: 'requester',
};

const fromCode = (value: string): TicketsRole | null => {
  if (value === 'tickets.admin' || value === 'admin' || value === 'administrador') return 'admin';
  if (value === 'tickets.area_manager' || value === 'area_manager' || value === 'responsable' || value === 'jefe-area') return 'area_manager';
  if (value === 'tickets.assistant' || value === 'assistant' || value === 'asistente') return 'assistant';
  if (value === 'tickets.requester' || value === 'requester' || value === 'solicitante') return 'requester';
  return null;
};

export const resolveTicketsRole = (user: TicketsUser | null): TicketsRole => {
  if (!user) return 'requester';
  const resolved = user.roles
    .map(fromCode)
    .filter((role): role is TicketsRole => role !== null)
    .sort((left, right) => ROLE_RANK.indexOf(left) - ROLE_RANK.indexOf(right))[0];
  return resolved ?? USERNAME_FALLBACK[user.username.toLocaleLowerCase('es')] ?? 'requester';
};

export const homePathFor = (role: TicketsRole): string => (role === 'requester' ? '/mis-tickets' : '/inicio');
