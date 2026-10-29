import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';
import { RecaptchaService } from '../../../../core/security/recaptcha.service';

@Component({
  selector: 'app-tickets-login',
  templateUrl: './tickets-login.component.html',
})
export class TicketsLoginComponent {
  private readonly auth = inject(TicketsAuthService);
  private readonly recaptcha = inject(RecaptchaService);
  private readonly router = inject(Router);
  readonly username = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly notice = signal<string | null>(null);

  value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!this.username().trim() || !this.password()) {
      this.notice.set('Ingresa usuario y contraseña.');
      return;
    }
    this.submitting.set(true);
    this.notice.set(null);
    try {
      await this.auth.login(this.username().trim(), this.password(), await this.recaptcha.executeLogin());
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No pudimos iniciar sesión.');
    } finally {
      this.submitting.set(false);
    }
  }
}
