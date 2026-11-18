import { Component, computed, inject, output, signal } from '@angular/core';

import { TicketsAuthService } from '../../../core/auth/tickets-auth.service';
import { UiAlertComponent } from '../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../shared/ui/field/ui-field.component';

@Component({
  selector: 'app-password-change',
  imports: [UiAlertComponent, UiButtonComponent, UiFieldComponent],
  templateUrl: './password-change.component.html',
})
export class PasswordChangeComponent {
  private readonly auth = inject(TicketsAuthService);
  readonly completed = output<void>();
  readonly password = signal('');
  readonly confirmation = signal('');
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly notice = signal<string | null>(null);
  readonly passwordError = computed(() => {
    if (!this.submitted()) return '';
    return /^[^<>]{8,72}$/u.test(this.password()) ? '' : 'Usa entre 8 y 72 caracteres, sin < ni >.';
  });
  readonly confirmationError = computed(() => {
    if (!this.submitted()) return '';
    if (!this.confirmation()) return 'Confirma la nueva contraseña.';
    return this.password() === this.confirmation() ? '' : 'La confirmación no coincide.';
  });

  async save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.submitted.set(true);
    const next = this.password();
    if (this.passwordError() || this.confirmationError()) {
      this.notice.set('Revisa los datos marcados para continuar.');
      return;
    }
    this.submitting.set(true);
    this.notice.set(null);
    try {
      await this.auth.changePassword(next);
      this.completed.emit();
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No pudimos cambiar la contraseña.');
    } finally {
      this.submitting.set(false);
    }
  }
}
