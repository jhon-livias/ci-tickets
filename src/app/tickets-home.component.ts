import { Component, inject } from '@angular/core';

import { SsoAuthService, type TicketsSsoIdentity } from './core/auth/sso-auth.service';

@Component({
  selector: 'app-tickets-home',
  template: `
    <main class="grid min-h-dvh place-items-center bg-[#faf6f7] p-6">
      <section class="w-full max-w-xl rounded-2xl bg-white p-8 shadow-[0_8px_24px_rgb(30_30_30_/_8%)]">
        <p class="text-sm font-semibold text-[#92001f]">UNIVERSIDAD PRIVADA DE TRUJILLO</p>
        <h1 class="mt-2 font-[var(--font-heading)] text-3xl font-semibold text-[#1e1e1e]">Atención UPRIT</h1>
        <p class="mt-3 text-[#7c8691]">{{ identity ? 'Sesión iniciada para ' + (identity.displayName || identity.username) + '.' : 'Ingresa con tu cuenta institucional para registrar y seguir tus tickets.' }}</p>
        <button type="button" class="mt-6 rounded-lg bg-[#92001f] px-5 py-2.5 font-semibold text-white" (click)="login()">
          {{ identity ? 'Continuar' : 'Ingresar con cuenta institucional' }}
        </button>
      </section>
    </main>
  `,
})
export class TicketsHomeComponent {
  private readonly sso = inject(SsoAuthService);
  readonly identity = loadIdentity();

  login(): void {
    if (!this.identity) this.sso.beginLogin();
  }
}

const loadIdentity = (): TicketsSsoIdentity | null => {
  const serialized = sessionStorage.getItem('tickets.sso.identity');
  if (!serialized) return null;
  try {
    return JSON.parse(serialized) as TicketsSsoIdentity;
  } catch {
    sessionStorage.removeItem('tickets.sso.identity');
    return null;
  }
};
