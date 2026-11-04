import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { TicketsAuthService } from '../../core/auth/tickets-auth.service';
import { homePathFor, resolveTicketsRole } from '../../core/auth/tickets-role';
import { TicketsCatalogService } from '../../features/tickets/data-access/tickets-catalog.service';
import { TicketsViewState } from '../../features/tickets/state/tickets-view.state';
import type { TicketsRole } from '../../features/tickets/models/ticket.model';
import { UiButtonComponent } from '../../shared/ui/button/ui-button.component';
import { UiDialogComponent } from '../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../shared/ui/field/ui-field.component';
import { UiSelectComponent, type UiSelectOption } from '../../shared/ui/select/ui-select.component';

interface NavItem {
  readonly label: string;
  readonly path: string;
  readonly children?: readonly { readonly label: string; readonly path: string }[];
}

@Component({
  selector: 'app-tickets-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, UiSelectComponent, UiDialogComponent, UiFieldComponent, UiButtonComponent],
  templateUrl: './app-layout.component.html',
})
export class AppLayoutComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(TicketsAuthService);
  private readonly catalog = inject(TicketsCatalogService);
  private readonly viewState = inject(TicketsViewState);

  readonly menuOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly ticketsOpen = signal(true);
  readonly profileDialog = signal(false);
  readonly profileEditing = signal(false);
  readonly phone = signal(this.catalog.contactPhone());
  readonly documentNumber = computed(() => this.catalog.contactDocument());
  readonly profileEmail = computed(() => this.catalog.contactEmail());
  readonly academicArea = this.viewState.academicArea;
  readonly displayName = computed(() => this.auth.user()?.displayName || this.auth.user()?.username || 'Usuario');
  readonly role = computed(() => resolveTicketsRole(this.auth.user()));
  readonly roleLabel = computed(() => ({
    requester: 'Solicitante',
    assistant: 'Asistente de TI',
    area_manager: 'Jefatura de TI',
    admin: 'Administrador del sistema',
  }[this.role()]));
  readonly navItems = computed(() => navFor(this.role(), this.catalog.canCreateTickets(), this.catalog.allowsInternal(), this.catalog.receivesTickets()));
  readonly showAreaFilter = computed(() => this.role() === 'requester');
  readonly areaOptions = computed((): readonly UiSelectOption[] => [
    { value: '', label: 'Todas las áreas' },
    { value: 'DERECHO', label: 'Derecho' },
    { value: 'EDUCACION INICIAL', label: 'Educación Inicial' },
  ]);

  constructor() {
    void this.bootstrap();
  }

  private async bootstrap(): Promise<void> {
    await this.catalog.refresh();
    await this.catalog.loadProfile();
    this.phone.set(this.catalog.contactPhone());
  }

  toggleMenu(): void { this.menuOpen.update((value) => !value); }
  toggleTickets(): void { this.ticketsOpen.update((value) => !value); }
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
  openProfile(): void {
    this.phone.set(this.catalog.contactPhone());
    this.profileEditing.set(false);
    this.profileDialog.set(true);
    this.profileOpen.set(false);
  }
  async savePhone(): Promise<void> {
    try {
      await this.catalog.updatePhone(this.phone().trim());
      this.profileEditing.set(false);
      this.profileDialog.set(false);
    } catch {
      this.profileEditing.set(true);
    }
  }
  async logout(): Promise<void> {
    try {
      await this.auth.logout();
    } finally {
      await this.router.navigateByUrl('/login');
    }
  }
}

export { homePathFor };

const navFor = (
  role: TicketsRole,
  canCreateTickets: boolean,
  allowsInternal: boolean,
  receivesTickets: boolean,
): readonly NavItem[] => {
  if (role === 'requester') {
    return [
      { label: 'Mis tickets', path: '/mis-tickets' },
      ...(canCreateTickets ? [{ label: 'Crear ticket', path: '/crear' }] : []),
    ];
  }
  if (role === 'assistant') {
    return [
      { label: 'Inicio', path: '/inicio' },
      ...(receivesTickets ? [{ label: 'Cola de tickets', path: '/cola' }] : []),
      ...(allowsInternal ? [{ label: 'Tickets internos', path: '/internos' }] : []),
      ...(receivesTickets ? [{ label: 'Tickets cerrados', path: '/cerrados' }] : []),
    ];
  }
  if (role === 'area_manager') {
    const ticketChildren = [
      ...(receivesTickets ? [{ label: 'Cola de tickets', path: '/cola' }] : []),
      ...(receivesTickets ? [{ label: 'Tickets cerrados', path: '/historial' }] : []),
      ...(allowsInternal ? [{ label: 'Tickets internos', path: '/tickets-internos' }] : []),
    ];
    return [
      { label: 'Inicio', path: '/inicio' },
      ...(ticketChildren.length
        ? [{ label: 'Tickets', path: ticketChildren[0].path, children: ticketChildren }]
        : []),
      { label: 'Equipo de TI', path: '/equipo' },
      { label: 'Prioridades', path: '/prioridades' },
    ];
  }
  return [
    { label: 'Inicio', path: '/inicio' },
    { label: 'Áreas', path: '/areas' },
    { label: 'Organigrama', path: '/organigrama' },
    { label: 'Categorías', path: '/categorias' },
  ];
};
