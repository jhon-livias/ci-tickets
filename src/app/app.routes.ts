import { Routes } from '@angular/router';

import { ticketsAuthGuard, ticketsHomeGuard, ticketsRoleGuard } from './core/auth/tickets-auth.guard';
import { colaListResolver } from './features/tickets/pages/staff/cola.resolver';
import { TicketsLoginComponent } from './features/auth/pages/login/tickets-login.component';
import { AreasPage } from './features/tickets/pages/admin/areas.page';
import { CategoriesPage } from './features/tickets/pages/admin/categories.page';
import { OrgChartPage } from './features/tickets/pages/admin/org-chart.page';
import { PrioritiesPage } from './features/tickets/pages/manager/priorities.page';
import { TeamPage } from './features/tickets/pages/manager/team.page';
import { CreateTicketPage } from './features/tickets/pages/requester/create-ticket.page';
import { MyTicketsPage } from './features/tickets/pages/requester/my-tickets.page';
import { assistantClosed, managerHistory } from './features/tickets/pages/staff/ticket-list.configs';
import { StaffHomePage } from './features/tickets/pages/staff/staff-home.page';
import { TicketsListPage } from './features/tickets/pages/staff/tickets-list.page';
import { AppLayoutComponent } from './layouts/app-layout/app-layout.component';

export const routes: Routes = [
  { path: 'login', title: 'Iniciar sesión', component: TicketsLoginComponent },
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [ticketsAuthGuard],
    children: [
      { path: '', pathMatch: 'full', component: StaffHomePage, canActivate: [ticketsHomeGuard] },
      { path: 'mis-tickets', title: 'Mis tickets', component: MyTicketsPage, canActivate: [ticketsRoleGuard(['requester'])] },
      { path: 'crear', title: 'Crear ticket', component: CreateTicketPage, canActivate: [ticketsRoleGuard(['requester'])] },
      { path: 'inicio', title: 'Inicio', component: StaffHomePage, canActivate: [ticketsRoleGuard(['assistant', 'area_manager', 'admin'])] },
      { path: 'cola', title: 'Cola de tickets', component: TicketsListPage, canActivate: [ticketsRoleGuard(['assistant', 'area_manager'])], resolve: { list: colaListResolver } },
      { path: 'cerrados', title: 'Tickets cerrados', component: TicketsListPage, canActivate: [ticketsRoleGuard(['assistant'])], data: { list: assistantClosed } },
      { path: 'historial', title: 'Tickets cerrados', component: TicketsListPage, canActivate: [ticketsRoleGuard(['area_manager'])], data: { list: managerHistory } },
      { path: 'equipo', title: 'Equipo de TI', component: TeamPage, canActivate: [ticketsRoleGuard(['area_manager'])] },
      { path: 'prioridades', title: 'Prioridades', component: PrioritiesPage, canActivate: [ticketsRoleGuard(['area_manager'])] },
      { path: 'areas', title: 'Áreas', component: AreasPage, canActivate: [ticketsRoleGuard(['admin'])] },
      { path: 'organigrama', title: 'Organigrama', component: OrgChartPage, canActivate: [ticketsRoleGuard(['admin'])] },
      { path: 'categorias', title: 'Categorías', component: CategoriesPage, canActivate: [ticketsRoleGuard(['admin'])] },
    ],
  },
  { path: '**', redirectTo: '' },
];
