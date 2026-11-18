import { inject } from '@angular/core';
import { CanActivateFn, Router, type UrlTree } from '@angular/router';

import { TicketsCatalogService } from '../../features/tickets/data-access/tickets-catalog.service';
import { homePathFor, resolveTicketsRole } from './tickets-role';
import { TicketsAuthService } from './tickets-auth.service';
import type { TicketsRole } from '../../features/tickets/models/ticket.model';

export const ticketsAuthGuard: CanActivateFn = async () => {
  const auth = inject(TicketsAuthService);
  const router = inject(Router);
  if (auth.user()) return true;
  try {
    if (await auth.restore()) return true;
  } catch {
    return router.createUrlTree(['/login']);
  }
  return router.createUrlTree(['/login']);
};

export const ticketsRoleGuard = (allowed: readonly TicketsRole[]): CanActivateFn => (): true | UrlTree => {
  const auth = inject(TicketsAuthService);
  const router = inject(Router);
  const role = resolveTicketsRole(auth.user());
  return allowed.includes(role) ? true : router.createUrlTree([homePathFor(role)]);
};

export const ticketsAccessGuard = (section: 'mine' | 'create' | 'queue'): CanActivateFn => async () => {
  const catalog = inject(TicketsCatalogService);
  const auth = inject(TicketsAuthService);
  const router = inject(Router);
  await catalog.ensureAccess();
  const allowed = section === 'mine' ? catalog.canSeeMine() : section === 'create' ? catalog.canSeeCreate() : catalog.canSeeQueue();
  const role = resolveTicketsRole(auth.user());
  const landing = catalog.canSeeMine()
    ? '/mis-tickets'
    : catalog.canSeeQueue()
      ? '/cola'
      : homePathFor(role);
  return allowed ? true : router.createUrlTree([landing]);
};

export const ticketsHomeGuard: CanActivateFn = () => {
  const auth = inject(TicketsAuthService);
  const router = inject(Router);
  return router.createUrlTree([homePathFor(resolveTicketsRole(auth.user()))]);
};
