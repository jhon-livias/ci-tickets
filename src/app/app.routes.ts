import { Routes } from '@angular/router';

import { TicketsHomeComponent } from './tickets-home.component';
import { AuthCallbackComponent } from './auth-callback.component';
import { TicketsLoginComponent } from './tickets-login.component';

export const routes: Routes = [
  { path: '', title: 'Atención UPRIT', component: TicketsHomeComponent },
  { path: 'login', title: 'Iniciar sesión', component: TicketsLoginComponent },
  { path: 'auth/callback', title: 'Iniciando sesión', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' },
];
