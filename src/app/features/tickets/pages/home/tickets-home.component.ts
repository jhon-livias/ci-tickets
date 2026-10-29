import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tickets-home',
  templateUrl: './tickets-home.component.html',
})
export class TicketsHomeComponent {
  private readonly router = inject(Router);

  login(): void {
    void this.router.navigateByUrl('/login');
  }
}
