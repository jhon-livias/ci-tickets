import { Component, computed, input, output, signal } from '@angular/core';

import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { PRIORITY_LABELS, STATUS_LABELS, canReopenTicket, formatDate, formatDateTime, historyCaption } from '../../models/ticket-labels';
import { nextStatuses, statusNeedsAssignee, statusNeedsComment } from '../../models/status-transition';
import type { Ticket, TicketHistoryEntry, TicketStatus } from '../../models/ticket.model';

export type TicketDetailMode = 'readonly' | 'reopen' | 'status' | 'edit';

@Component({
  selector: 'app-ticket-detail',
  imports: [UiDialogComponent, UiButtonComponent, UiFieldComponent, UiSelectComponent],
  templateUrl: './ticket-detail.component.html',
})
export class TicketDetailComponent {
  readonly ticket = input.required<Ticket>();
  readonly mode = input<TicketDetailMode>('readonly');
  readonly staffFields = input(true);
  readonly assigneeOptions = input<readonly UiSelectOption[]>([]);
  readonly closed = output<void>();
  readonly reopen = output<string>();
  readonly statusChanged = output<{
    readonly status: TicketStatus;
    readonly note: string;
    readonly assignedName: string;
    readonly attachmentNames: readonly string[];
  }>();
  readonly editRequested = output<void>();

  readonly reason = signal('');
  readonly note = signal('');
  readonly nextStatus = signal('');
  readonly assignee = signal('');
  readonly files = signal<readonly string[]>([]);
  readonly changing = signal(false);
  readonly error = signal<string | null>(null);
  readonly statusOptions = computed((): readonly UiSelectOption[] =>
    nextStatuses(this.ticket().status).map((status) => ({ value: status, label: STATUS_LABELS[status] })),
  );
  readonly needsAssignee = computed(() => statusNeedsAssignee(this.nextStatus()));
  readonly needsComment = computed(() => statusNeedsComment(this.nextStatus()));
  readonly labels = computed(() => {
    const ticket = this.ticket();
    return {
      status: STATUS_LABELS[ticket.status],
      priority: PRIORITY_LABELS[ticket.priority],
      createdAt: formatDateTime(ticket.createdAt),
      dueOn: formatDate(ticket.dueOn),
      canReopen: canReopenTicket(ticket.resolvedAt, ticket.status),
      canChange: nextStatuses(ticket.status).length > 0,
      affectedDocument: (ticket.about ?? 'SELF') === 'SELF' ? (ticket.requesterDocument ?? '') : (ticket.affectedDocument ?? ''),
      affectedName: (ticket.about ?? 'SELF') === 'SELF' ? '' : ticket.aboutLabel,
    };
  });

  protected when(value: string): string {
    return formatDateTime(value);
  }

  protected statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  protected caption(entry: TicketHistoryEntry): string {
    return historyCaption(entry);
  }

  protected startChange(): void {
    const options = this.statusOptions();
    this.nextStatus.set(options.length === 1 ? options[0].value : '');
    this.note.set('');
    this.assignee.set('');
    this.files.set([]);
    this.error.set(null);
    this.changing.set(true);
  }

  protected onFiles(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files) return;
    this.files.set([...input.files].slice(0, 5).map((file) => file.name));
  }

  protected confirmReopen(): void {
    const reason = this.reason().trim();
    if (reason.length < 5) return;
    this.reopen.emit(reason);
  }

  protected confirmStatus(): void {
    const status = this.nextStatus() as TicketStatus;
    if (!status || status === this.ticket().status) {
      this.error.set('Ese estado ya está registrado.');
      return;
    }
    if (this.needsAssignee() && !this.assignee()) {
      this.error.set('Indica a quién se deriva el ticket.');
      return;
    }
    if (this.needsComment() && this.note().trim().length < 5) {
      this.error.set('El comentario es obligatorio para este estado.');
      return;
    }
    this.statusChanged.emit({
      status,
      note: this.note().trim(),
      assignedName: this.assignee(),
      attachmentNames: this.files(),
    });
    this.changing.set(false);
  }
}
