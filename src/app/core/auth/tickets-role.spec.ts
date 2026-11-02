import { resolveTicketsRole } from './tickets-role';

describe('resolveTicketsRole', () => {
  it('prefers an explicit tickets admin role', () => {
    expect(resolveTicketsRole({
      id: '1',
      username: 'aramirez',
      displayName: 'Andrea',
      roles: ['tickets.requester', 'tickets.admin'],
    })).toBe('admin');
  });

  it('falls back to the known institutional username until Identity sends tickets roles', () => {
    expect(resolveTicketsRole({ id: '1', username: 'jefe-area', displayName: 'Jefe', roles: [] })).toBe('area_manager');
    expect(resolveTicketsRole({ id: '1', username: 'asistente', displayName: 'Asistente', roles: [] })).toBe('assistant');
    expect(resolveTicketsRole({ id: '1', username: 'administrador', displayName: 'Admin', roles: [] })).toBe('admin');
    expect(resolveTicketsRole({ id: '1', username: 'solicitante', displayName: 'Solicitante', roles: [] })).toBe('requester');
  });
});
