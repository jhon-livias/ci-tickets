import { Component, computed, inject, signal } from '@angular/core';

import { TicketStatsComponent } from '../../components/ticket-stats/ticket-stats.component';
import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { isoDate } from '../../models/ticket-labels';
import { resolveTicketsRole } from '../../../../core/auth/tickets-role';
import { TicketsAuthService } from '../../../../core/auth/tickets-auth.service';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';

@Component({
  selector: 'app-staff-home-page',
  imports: [UiPageHeaderComponent, UiFilterBarComponent, UiFieldComponent, UiButtonComponent, TicketStatsComponent],
  templateUrl: './staff-home.page.html',
})
export class StaffHomePage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly auth = inject(TicketsAuthService);
  readonly from = signal(this.catalog.oldestPendingDate());
  readonly to = signal(isoDate());
  readonly role = computed(() => resolveTicketsRole(this.auth.user()));
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Inicio' }];
  readonly description = computed(() => this.role() === 'admin'
    ? 'Configura las áreas de la universidad, su jerarquía organizativa y las categorías que verá el solicitante.'
    : this.role() === 'area_manager'
      ? 'Monitorea la carga de trabajo, los tiempos de atención y el rendimiento del equipo.'
      : 'Resumen general de los tickets asignados y su estado actual.');
  readonly stats = computed(() => {
    const tickets = this.catalog.tickets().filter((ticket) => {
      const day = ticket.createdAt.slice(0, 10);
      return day >= this.from() && day <= this.to();
    });
    const role = this.role();
    if (role === 'admin') {
      const areas = this.catalog.areas();
      const cats = this.catalog.categories().filter((category) => {
        const area = areas.find((item) => item.id === category.areaId);
        return !!(area && area.enabled && area.receivesTickets && category.enabled);
      });
      return [
        { label: 'Áreas registradas', value: areas.length, hint: 'Activas e inactivas' },
        { label: 'Áreas que reciben tickets', value: areas.filter((area) => area.enabled && area.receivesTickets).length, hint: 'Visibles para el solicitante' },
        { label: 'Categorías activas', value: cats.length, hint: 'Disponibles en el formulario' },
      ];
    }
    if (role === 'area_manager') {
      return [
        { label: 'Tickets recibidos', value: tickets.length, hint: 'Periodo seleccionado' },
        { label: 'Pendientes', value: tickets.filter((ticket) => ticket.status === 'CREATED' || ticket.status === 'IN_REVIEW').length, hint: 'Tickets activos' },
        { label: 'Resueltos', value: tickets.filter((ticket) => ticket.status === 'RESOLVED').length, hint: 'Tickets finalizados' },
        { label: 'Integrantes del equipo', value: this.catalog.team().length, hint: 'Equipo registrado (incluido responsable)' },
      ];
    }
    return [
      { label: 'Tickets asignados', value: tickets.length, hint: 'En tu cola de trabajo' },
      { label: 'Tickets pendientes', value: tickets.filter((ticket) => ticket.status === 'CREATED').length, hint: 'Por revisar' },
      { label: 'En atención', value: tickets.filter((ticket) => ticket.status === 'IN_REVIEW').length, hint: 'Actualmente en proceso' },
      { label: 'Resueltos', value: tickets.filter((ticket) => ticket.status === 'RESOLVED').length, hint: 'Tickets resueltos en el periodo' },
    ];
  });

  clearDates(): void {
    this.from.set(this.catalog.oldestPendingDate());
    this.to.set(isoDate());
  }
}
