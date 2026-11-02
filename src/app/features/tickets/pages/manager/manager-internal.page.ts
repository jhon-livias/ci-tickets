import { Component, computed, inject, signal } from '@angular/core';

import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';
import { TicketDetailComponent } from '../../components/ticket-detail/ticket-detail.component';
import { rowId, toTicketRow } from '../../data-access/ticket-table.adapter';
import { emptyQuery, filterTickets, priorityOptions, statusOptions } from '../../data-access/ticket-query';
import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { isoDate, weekBounds } from '../../models/ticket-labels';
import type { Ticket, TicketPriority, TicketStatus } from '../../models/ticket.model';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-manager-internal-page',
  imports: [
    UiPageHeaderComponent,
    UiAlertComponent,
    UiButtonComponent,
    UiFilterBarComponent,
    UiFieldComponent,
    UiSelectComponent,
    UiTableComponent,
    UiDialogComponent,
    TicketDetailComponent,
  ],
  templateUrl: './manager-internal.page.html',
})
export class ManagerInternalPage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly auth = inject(TicketsAuthService);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Tickets internos' }];
  readonly week = weekBounds();
  readonly emitFrom = signal(this.week.from);
  readonly emitTo = signal(this.week.to);
  readonly emitColab = signal('');
  readonly emitStatus = signal('');
  readonly emitPriority = signal('');
  readonly recFrom = signal(this.catalog.oldestPendingDate());
  readonly recTo = signal(isoDate());
  readonly recCode = signal('');
  readonly recStatus = signal('');
  readonly recPriority = signal('');
  readonly creating = signal(false);
  readonly selected = signal<Ticket | null>(null);
  readonly selectedMode = signal<'edit' | 'status'>('edit');
  readonly assigned = signal('');
  readonly dueOn = signal('');
  readonly priority = signal<TicketPriority | ''>('');
  readonly category = signal('');
  readonly description = signal('');
  readonly notice = signal<string | null>(null);
  readonly statusChoices = statusOptions(['CREATED', 'IN_REVIEW', 'RESOLVED']);
  readonly receivedStatusChoices = statusOptions(['CREATED', 'IN_REVIEW']);
  readonly priorityChoices = priorityOptions();
  readonly collaboratorChoices = computed((): readonly UiSelectOption[] => [
    { value: '', label: 'Todos' },
    ...this.catalog.team().filter((member) => !member.isManager).map((member) => ({ value: member.fullName, label: member.fullName })),
  ]);
  readonly assigneeChoices = computed((): readonly UiSelectOption[] =>
    this.catalog.team().filter((member) => !member.isManager).map((member) => ({ value: member.fullName, label: member.fullName })),
  );
  readonly categoryChoices = computed((): readonly UiSelectOption[] =>
    this.catalog.categories().filter((category) => category.areaId === 'ti').map((category) => ({ value: category.name, label: category.name })),
  );
  readonly emittedColumns: readonly UiTableColumn[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'createdAt', label: 'Fecha y hora' },
    { key: 'assigned', label: 'Colaborador' },
    { key: 'priority', label: 'Prioridad' },
    { key: 'status', label: 'Estado' },
    { key: 'dueOn', label: 'Fecha límite' },
  ];
  readonly receivedColumns: readonly UiTableColumn[] = [
    { key: 'code', label: 'N.º ticket' },
    { key: 'requester', label: 'Solicitante' },
    { key: 'role', label: 'Cargo' },
    { key: 'createdAt', label: 'Fecha y hora' },
    { key: 'category', label: 'Categoría' },
    { key: 'status', label: 'Estado' },
    { key: 'estimate', label: 'Tiempo estimado' },
    { key: 'priority', label: 'Prioridad' },
    { key: 'dueOn', label: 'Fecha límite' },
  ];
  readonly emittedRows = computed(() => filterTickets(this.catalog.tickets().filter((ticket) => ticket.kind === 'INTERNAL' && ticket.emittedInternally), {
    ...emptyQuery(),
    from: this.emitFrom(),
    to: this.emitTo(),
    collaborator: this.emitColab(),
    status: this.emitStatus(),
    priority: this.emitPriority(),
  }).map(toTicketRow));
  readonly receivedRows = computed(() => filterTickets(this.catalog.tickets().filter((ticket) => ticket.kind === 'INTERNAL' && !ticket.emittedInternally && (ticket.status === 'CREATED' || ticket.status === 'IN_REVIEW')), {
    ...emptyQuery(),
    from: this.recFrom(),
    to: this.recTo(),
    code: this.recCode(),
    status: this.recStatus(),
    priority: this.recPriority(),
  }).map(toTicketRow));

  openEmitted(row: UiTableRow): void {
    this.selectedMode.set('edit');
    this.selected.set(this.catalog.ticketById(rowId(row)));
  }

  openReceived(row: UiTableRow): void {
    this.selectedMode.set('status');
    this.selected.set(this.catalog.ticketById(rowId(row)));
  }

  setPriority(value: string): void {
    if (value === 'HIGH' || value === 'MEDIUM' || value === 'LOW' || value === '') this.priority.set(value);
  }

  create(): void {
    this.notice.set(null);
    if (!this.assigned() || !this.dueOn() || !this.priority() || !this.category() || this.description().trim().length < 10) {
      this.notice.set('Completa asignado, fecha límite, prioridad, categoría y una descripción detallada.');
      return;
    }
    const actor = this.auth.user()?.displayName || this.auth.user()?.username || 'Responsable';
    this.catalog.createInternalTicket({
      assignedName: this.assigned(),
      dueOn: this.dueOn(),
      priority: this.priority() as TicketPriority,
      categoryName: this.category(),
      description: this.description().trim(),
      attachmentNames: [],
    }, actor);
    this.creating.set(false);
    this.assigned.set('');
    this.dueOn.set('');
    this.priority.set('');
    this.category.set('');
    this.description.set('');
  }

  changeStatus(event: { readonly status: TicketStatus; readonly note: string; readonly assignedName: string }): void {
    const ticket = this.selected();
    const name = this.auth.user()?.displayName || this.auth.user()?.username || 'Responsable';
    if (!ticket) return;
    this.catalog.changeStatus(ticket.id, event.status, name, event.note, event.assignedName || undefined);
    this.selected.set(this.catalog.ticketById(ticket.id));
  }
}
