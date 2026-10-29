import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SsoAuthService, type TicketsSsoIdentity } from './core/auth/sso-auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <main class="grid min-h-dvh place-items-center bg-[#faf6f7] p-6">
      <section class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_8px_24px_rgb(30_30_30_/_8%)]">
        <p class="text-sm font-semibold text-[#92001f]">ATENCIÓN UPRIT</p>
        <h1 class="mt-2 text-2xl font-semibold text-[#1e1e1e]">{{ title() }}</h1>
        <p class="mt-3 text-[#66717d]">{{ detail() }}</p>
      </section>
    </main>
  `,
})
export class AuthCallbackComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sso = inject(SsoAuthService);
  readonly title = signal('Verificando inicio de sesión');
  readonly detail = signal('Estamos validando la autorización con el servicio de identidad.');

  constructor() {
    void this.finish();
  }

  private async finish(): Promise<void> {
    const code = this.route.snapshot.queryParamMap.get('code');
    const providerError = this.route.snapshot.queryParamMap.get('error');
    if (!code || providerError) {
      this.title.set('No se pudo iniciar sesión');
      this.detail.set('La autorización fue cancelada o no es válida.');
      return;
    }
    try {
      const identity = await this.sso.completeLogin(code, this.route.snapshot.queryParamMap.get('state'));
      storeIdentity(identity);
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.title.set('No se pudo iniciar sesión');
      this.detail.set(error instanceof Error ? error.message : 'Intenta nuevamente.');
    }
  }
}

const storeIdentity = (identity: TicketsSsoIdentity): void =>
  sessionStorage.setItem('tickets.sso.identity', JSON.stringify(identity));
