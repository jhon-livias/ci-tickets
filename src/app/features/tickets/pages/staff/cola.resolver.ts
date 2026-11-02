import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';

import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';
import { resolveTicketsRole } from '../../../../core/auth/tickets-role';
import { assistantQueue, managerQueue } from './ticket-list.configs';
import type { TicketsListConfig } from './tickets-list.page';

export const colaListResolver: ResolveFn<TicketsListConfig> = () =>
  resolveTicketsRole(inject(TicketsAuthService).user()) === 'area_manager' ? managerQueue : assistantQueue;
