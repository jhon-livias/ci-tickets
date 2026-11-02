import { inject } from '@angular/core';
import { CanActivateFn, Router, type UrlTree } from '@angular/router';

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

export const ticketsHomeGuard: CanActivateFn = () => {
  const auth = inject(TicketsAuthService);
  const router = inject(Router);
  return router.createUrlTree([homePathFor(resolveTicketsRole(auth.user()))]);
};
