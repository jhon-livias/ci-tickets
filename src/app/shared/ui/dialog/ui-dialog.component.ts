import { Component, input, output } from '@angular/core';

import { UiIconButtonComponent } from '../icon-button/ui-icon-button.component';

@Component({
  selector: 'ui-dialog',
  imports: [UiIconButtonComponent],
  templateUrl: './ui-dialog.component.html',
  styleUrl: './ui-dialog.component.css',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'ui-dialog-title',
    '(click)': 'closed.emit()',
    '(document:keydown.escape)': 'closed.emit()',
  },
})
export class UiDialogComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly closed = output<void>();

  protected keepOpen(event: Event): void {
    event.stopPropagation();
  }
}
