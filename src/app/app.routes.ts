import { Routes } from '@angular/router';

import { TicketsHomeComponent } from './tickets-home.component';
import { AuthCallbackComponent } from './auth-callback.component';

export const routes: Routes = [
  { path: '', title: 'Atención UPRIT', component: TicketsHomeComponent },
  { path: 'auth/callback', title: 'Iniciando sesión', component: AuthCallbackComponent },
  { path: '**', redirectTo: '' },
];
