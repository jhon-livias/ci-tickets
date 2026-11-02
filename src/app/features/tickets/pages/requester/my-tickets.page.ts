import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';
import { TicketDetailComponent } from '../../components/ticket-detail/ticket-detail.component';
import { rowId, toTicketRow } from '../../data-access/ticket-table.adapter';
import { emptyQuery, filterTickets, statusOptions } from '../../data-access/ticket-query';
import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { isoDate, monthStart } from '../../models/ticket-labels';
import type { Ticket } from '../../models/ticket.model';
import { TicketsViewState } from '../../state/tickets-view.state';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-my-tickets-page',
  imports: [
    UiPageHeaderComponent,
    UiFilterBarComponent,
    UiFieldComponent,
    UiSelectComponent,
    UiButtonComponent,
    UiTableComponent,
    TicketDetailComponent,
  ],
  templateUrl: './my-tickets.page.html',
})
export class MyTicketsPage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly auth = inject(TicketsAuthService);
  private readonly viewState = inject(TicketsViewState);
  private readonly router = inject(Router);

  readonly from = signal(monthStart());
  readonly to = signal(isoDate());
  readonly status = signal('');
  readonly selected = signal<Ticket | null>(null);
  readonly columns: readonly UiTableColumn[] = [
    { key: 'code', label: 'N.º del ticket', sortable: true },
    { key: 'createdAt', label: 'Fecha y hora', sortable: true },
    { key: 'about', label: 'Sobre quién es el ticket' },
    { key: 'category', label: 'Categoría del ticket' },
    { key: 'status', label: 'Estado' },
    { key: 'estimate', label: 'Tiempo estimado' },
  ];
  readonly statusChoices = statusOptions(['CREATED', 'IN_REVIEW', 'DERIVED', 'RETURNED', 'RESOLVED', 'REOPENED']);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Mis tickets' }];
  readonly rows = computed(() =>
    filterTickets(this.catalog.tickets(), {
      ...emptyQuery(),
      from: this.from(),
      to: this.to(),
      status: this.status(),
    }, this.viewState.academicArea()).map(toTicketRow),
  );

  goCreate(): void { void this.router.navigateByUrl('/crear'); }

  clearFilters(): void {
    this.from.set(monthStart());
    this.to.set(isoDate());
    this.status.set('');
  }

  open(row: UiTableRow): void {
    this.selected.set(this.catalog.ticketById(rowId(row)));
  }

  reopen(reason: string): void {
    const ticket = this.selected();
    const name = this.auth.user()?.displayName || this.auth.user()?.username || 'Solicitante';
    if (!ticket) return;
    this.catalog.reopenTicket(ticket.id, reason, name);
    this.selected.set(this.catalog.ticketById(ticket.id));
  }
}
