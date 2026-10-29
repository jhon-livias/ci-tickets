import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';

@Component({
  selector: 'app-tickets-home',
  imports: [RouterLink],
  templateUrl: './tickets-home.component.html',
})
export class TicketsHomeComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(TicketsAuthService);
  readonly menuOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly displayName = computed(() => this.auth.user()?.displayName || this.auth.user()?.username || 'Usuario');

  login(): void {
    void this.router.navigateByUrl('/login');
  }

  toggleMenu(): void { this.menuOpen.update((value) => !value); }
  toggleProfile(): void { this.profileOpen.update((value) => !value); }
  async logout(): Promise<void> { await this.auth.logout(); await this.router.navigateByUrl('/login'); }
}
