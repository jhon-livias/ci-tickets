import { Routes } from '@angular/router';

import { TicketsLoginComponent } from './features/auth/pages/login/tickets-login.component';
import { TicketsHomeComponent } from './features/tickets/pages/home/tickets-home.component';

export const routes: Routes = [
  { path: '', title: 'Atención UPRIT', component: TicketsHomeComponent },
  { path: 'login', title: 'Iniciar sesión', component: TicketsLoginComponent },
  { path: '**', redirectTo: '' },
];
