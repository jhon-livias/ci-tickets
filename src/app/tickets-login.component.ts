import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TicketsAuthService } from './core/auth/tickets-auth.service';
import { RecaptchaService } from './core/security/recaptcha.service';

@Component({
  selector: 'app-tickets-login',
  template: `
    <main class="grid min-h-dvh place-items-center bg-[#faf6f7] p-6"><section class="w-full max-w-md rounded-2xl bg-white p-8 shadow-[0_8px_24px_rgb(30_30_30_/_8%)]">
      <p class="text-sm font-semibold text-[#92001f]">ATENCIÓN UPRIT</p><h1 class="mt-2 text-3xl font-semibold text-[#1e1e1e]">Iniciar sesión</h1>
      <form class="mt-6 space-y-4" (submit)="submit($event)">
        <label class="block text-sm font-medium">Usuario o correo<input class="mt-1 w-full rounded-lg border p-3" autocomplete="username" [value]="username()" (input)="username.set(value($event))" /></label>
        <label class="block text-sm font-medium">Contraseña<input class="mt-1 w-full rounded-lg border p-3" type="password" autocomplete="current-password" [value]="password()" (input)="password.set(value($event))" /></label>
        @if (notice()) { <p class="text-sm text-[#92001f]" role="alert">{{ notice() }}</p> }
        <button class="w-full rounded-lg bg-[#92001f] p-3 font-semibold text-white disabled:opacity-60" [disabled]="submitting()" type="submit">{{ submitting() ? 'Ingresando…' : 'Ingresar' }}</button>
      </form>
      <p class="mt-5 text-center text-xs text-[#7c8691]">Este sitio está protegido por reCAPTCHA de Google.</p>
    </section></main>
  `,
})
export class TicketsLoginComponent {
  private readonly auth = inject(TicketsAuthService); private readonly recaptcha = inject(RecaptchaService); private readonly router = inject(Router);
  readonly username = signal(''); readonly password = signal(''); readonly submitting = signal(false); readonly notice = signal<string | null>(null);
  value(event: Event): string { return (event.target as HTMLInputElement).value; }
  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault(); if (!this.username().trim() || !this.password()) { this.notice.set('Ingresa usuario y contraseña.'); return; }
    this.submitting.set(true); this.notice.set(null);
    try { await this.auth.login(this.username().trim(), this.password(), await this.recaptcha.executeLogin()); await this.router.navigateByUrl('/'); }
    catch (error) { this.notice.set(error instanceof Error ? error.message : 'No pudimos iniciar sesión.'); }
    finally { this.submitting.set(false); }
  }
}
