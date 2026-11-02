import { Component, input } from '@angular/core';

import { UiCardComponent } from '../../../../shared/ui/card/ui-card.component';

export interface TicketStat {
  readonly label: string;
  readonly value: number;
  readonly hint: string;
}

@Component({
  selector: 'app-ticket-stats',
  imports: [UiCardComponent],
  template: `
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      @for (stat of items(); track stat.label) {
        <ui-card>
          <p class="text-sm text-[#7c8691]">{{ stat.label }}</p>
          <p class="mt-1 text-3xl font-bold text-[#1e1e1e]">{{ stat.value }}</p>
          <p class="mt-1 text-xs text-[#7c8691]">{{ stat.hint }}</p>
        </ui-card>
      }
    </div>
  `,
})
export class TicketStatsComponent {
  readonly items = input.required<readonly TicketStat[]>();
}
