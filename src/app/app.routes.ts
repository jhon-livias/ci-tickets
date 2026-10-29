import { Routes } from '@angular/router';

import { TicketsHomeComponent } from './tickets-home.component';

export const routes: Routes = [{ path: '', title: 'Atención UPRIT', component: TicketsHomeComponent }, { path: '**', redirectTo: '' }];
