import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

import { TicketDetailComponent, type TicketDetailMode } from '../../components/ticket-detail/ticket-detail.component';
import { rowId, toTicketRow } from '../../data-access/ticket-table.adapter';
import { emptyQuery, filterTickets, priorityOptions, statusOptions } from '../../data-access/ticket-query';
import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { isoDate, weekBounds } from '../../models/ticket-labels';
import type { Ticket, TicketKind, TicketStatus } from '../../models/ticket.model';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

export interface TicketsListConfig {
  readonly title: string;
  readonly description: string;
  readonly statuses: readonly TicketStatus[];
  readonly kind: TicketKind | 'ALL';
  readonly defaultKind: TicketKind | '';
  readonly showCollaborator: boolean;
  readonly showDue: boolean;
  readonly showKindFilter: boolean;
  readonly mode: TicketDetailMode;
  readonly dateDefault: 'none' | 'week' | 'pending';
  readonly emittedOnly?: boolean;
  readonly receivedInternal?: boolean;
}

const isListConfig = (value: unknown): value is TicketsListConfig =>
  !!value && typeof value === 'object' && typeof (value as TicketsListConfig).title === 'string';

@Component({
  selector: 'app-tickets-list-page',
  imports: [
    UiPageHeaderComponent,
    UiFilterBarComponent,
    UiFieldComponent,
    UiSelectComponent,
    UiButtonComponent,
    UiTableComponent,
    TicketDetailComponent,
  ],
  templateUrl: './tickets-list.page.html',
})
export class TicketsListPage {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(TicketsCatalogService);
  private readonly routeData = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  readonly config = computed(() => {
    const data = this.routeData()['list'];
    if (!isListConfig(data)) {
      return {
        title: 'Tickets',
        description: '',
        statuses: [],
        kind: 'ALL',
        defaultKind: '',
        showCollaborator: false,
        showDue: false,
        showKindFilter: false,
        mode: 'readonly',
        dateDefault: 'none',
      } satisfies TicketsListConfig;
    }
    return data;
  });
  readonly from = signal(this.initialFrom());
  readonly to = signal(this.initialTo());
  readonly code = signal('');
  readonly requester = signal('');
  readonly status = signal('');
  readonly priority = signal('');
  readonly kind = signal<string>(this.config().defaultKind);
  readonly collaborator = signal('');
  readonly search = signal('');
  readonly selected = signal<Ticket | null>(null);
  readonly crumbs = computed(() => [{ label: 'Atención UPRIT' }, { label: this.config().title }]);
  readonly statusChoices = computed(() => statusOptions(this.config().statuses));
  readonly priorityChoices = priorityOptions();
  readonly kindChoices: readonly UiSelectOption[] = [
    { value: 'EXTERNAL', label: 'Externos' },
    { value: 'INTERNAL', label: 'Internos' },
    { value: '', label: 'Todos' },
  ];
  readonly collaboratorChoices = computed((): readonly UiSelectOption[] => [
    { value: '', label: 'Todos' },
    ...this.catalog.team().map((member) => ({ value: member.fullName, label: member.fullName })),
  ]);
  readonly assigneeChoices = computed((): readonly UiSelectOption[] =>
    this.catalog.team().map((member) => ({ value: member.fullName, label: member.fullName })),
  );
  readonly columns = computed((): readonly UiTableColumn[] => {
    const due = this.config().showDue;
    const base: UiTableColumn[] = [
      { key: 'code', label: 'N.º de ticket', sortable: true },
      { key: 'requester', label: 'Solicitante' },
      { key: 'role', label: 'Cargo' },
      { key: 'createdAt', label: 'Fecha y hora', sortable: true },
      { key: 'category', label: 'Categoría' },
      { key: 'status', label: 'Estado' },
      { key: 'estimate', label: 'Tiempo estimado' },
      { key: 'priority', label: 'Prioridad' },
    ];
    if (due) base.push({ key: 'dueOn', label: 'Fecha límite' });
    if (this.config().kind === 'ALL' && this.config().showKindFilter) {
      base.splice(4, 0, { key: 'kind', label: 'Tipo' });
    }
    return base;
  });
  readonly rows = computed(() => {
    const config = this.config();
    const source = this.catalog.tickets().filter((ticket) => {
      if (config.statuses.length && !config.statuses.includes(ticket.status)) return false;
      if (config.kind !== 'ALL' && ticket.kind !== config.kind) return false;
      if (config.emittedOnly && !ticket.emittedInternally) return false;
      if (config.receivedInternal && (ticket.kind !== 'INTERNAL' || ticket.emittedInternally)) return false;
      return true;
    });
    return filterTickets(source, {
      ...emptyQuery(),
      from: this.from(),
      to: this.to(),
      code: this.code(),
      requester: this.requester(),
      status: this.status(),
      priority: this.priority(),
      kind: this.kind(),
      collaborator: this.collaborator(),
      search: this.search(),
    }).map(toTicketRow);
  });

  clearFilters(): void {
    this.from.set(this.initialFrom());
    this.to.set(this.initialTo());
    this.code.set('');
    this.requester.set('');
    this.status.set('');
    this.priority.set('');
    this.kind.set(this.config().defaultKind);
    this.collaborator.set('');
    this.search.set('');
  }

  open(row: UiTableRow): void {
    this.selected.set(this.catalog.ticketById(rowId(row)));
  }

  async changeStatus(event: {
    readonly status: TicketStatus;
    readonly note: string;
    readonly assignedName: string;
    readonly attachmentNames: readonly string[];
  }): Promise<void> {
    const ticket = this.selected();
    if (!ticket) return;
    await this.catalog.changeStatus(ticket.id, event.status, event.note, event.assignedName || undefined, event.attachmentNames);
    this.selected.set(this.catalog.ticketById(ticket.id));
  }

  private initialFrom(): string {
    const data = this.route.snapshot.data['list'];
    const config = isListConfig(data) ? data : null;
    if (config?.dateDefault === 'week') return weekBounds().from;
    if (config?.dateDefault === 'pending') return this.catalog.oldestPendingDate();
    return '';
  }

  private initialTo(): string {
    const data = this.route.snapshot.data['list'];
    const config = isListConfig(data) ? data : null;
    if (config?.dateDefault === 'week') return weekBounds().to;
    if (config?.dateDefault === 'pending') return isoDate();
    return '';
  }
}
