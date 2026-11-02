import { Component, computed, input, output, signal } from '@angular/core';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { KIND_LABELS, PRIORITY_LABELS, STATUS_LABELS, canReopenTicket, formatDate, formatDateTime } from '../../models/ticket-labels';
import type { Ticket, TicketStatus } from '../../models/ticket.model';

export type TicketDetailMode = 'readonly' | 'reopen' | 'status' | 'edit';

@Component({
  selector: 'app-ticket-detail',
  imports: [UiDialogComponent, UiButtonComponent, UiFieldComponent, UiSelectComponent],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent {
  readonly ticket = input.required<Ticket>();
  readonly mode = input<TicketDetailMode>('readonly');
  readonly assigneeOptions = input<readonly UiSelectOption[]>([]);
  readonly closed = output<void>();
  readonly reopen = output<string>();
  readonly statusChanged = output<{ readonly status: TicketStatus; readonly note: string; readonly assignedName: string }>();
  readonly editRequested = output<void>();

  readonly reason = signal('');
  readonly note = signal('');
  readonly nextStatus = signal('');
  readonly assignee = signal('');
  readonly statusOptions = computed((): readonly UiSelectOption[] => {
    if (this.ticket().kind === 'INTERNAL') {
      return [
        { value: 'CREATED', label: 'Creado' },
        { value: 'IN_REVIEW', label: 'En revisión' },
        { value: 'RESOLVED', label: 'Resuelto' },
      ];
    }
    return [
      { value: 'CREATED', label: 'Creado' },
      { value: 'IN_REVIEW', label: 'En revisión' },
      { value: 'RETURNED', label: 'Devuelto' },
      { value: 'DERIVED', label: 'Derivado' },
      { value: 'RESOLVED', label: 'Resuelto' },
    ];
  });
  readonly labels = computed(() => {
    const ticket = this.ticket();
    return {
      status: STATUS_LABELS[ticket.status],
      priority: PRIORITY_LABELS[ticket.priority],
      kind: KIND_LABELS[ticket.kind],
      createdAt: formatDateTime(ticket.createdAt),
      dueOn: formatDate(ticket.dueOn),
      canReopen: canReopenTicket(ticket.resolvedAt, ticket.status),
    };
  });

  protected when(value: string): string {
    return formatDateTime(value);
  }

  protected confirmReopen(): void {
    const reason = this.reason().trim();
    if (reason.length < 5) return;
    this.reopen.emit(reason);
  }

  protected confirmStatus(): void {
    const status = this.nextStatus() as TicketStatus;
    if (!status) return;
    this.statusChanged.emit({ status, note: this.note().trim(), assignedName: this.assignee() });
  }
}
