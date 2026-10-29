import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';

@Component({
  selector: 'app-tickets-home',
  imports: [RouterLink],
  templateUrl: './tickets-home.component.html',
})
export class TicketsHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(TicketsAuthService);
  readonly menuOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly displayName = computed(() => this.auth.user()?.displayName || this.auth.user()?.username || 'Usuario');

  async ngOnInit(): Promise<void> {
    try {
      if (!await this.auth.restore()) await this.router.navigateByUrl('/login');
    } catch {
      await this.router.navigateByUrl('/login');
    }
  }

  toggleMenu(): void { this.menuOpen.update((value) => !value); }
  toggleProfile(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen.set(false);
    this.profileOpen.update((value) => !value);
  }
  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.profileOpen.set(false);
    this.notificationsOpen.update((value) => !value);
  }
  closePanels(): void { this.profileOpen.set(false); this.notificationsOpen.set(false); }
  async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } finally {
      await this.router.navigateByUrl('/login');
    }
  }
}
