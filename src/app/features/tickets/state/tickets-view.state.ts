import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TicketsViewState {
  readonly academicArea = signal('');
}
