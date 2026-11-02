import { Component, computed, inject, signal } from '@angular/core';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import type { ServiceArea } from '../../models/ticket.model';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';

interface OrgNode {
  readonly area: ServiceArea;
  readonly children: readonly OrgNode[];
}

@Component({
  selector: 'app-org-chart-page',
  imports: [UiPageHeaderComponent, UiDialogComponent, UiButtonComponent],
  templateUrl: './org-chart.page.html',
})
export class OrgChartPage {
  private readonly catalog = inject(TicketsCatalogService);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Organigrama' }];
  readonly selected = signal<ServiceArea | null>(null);
  readonly trees = computed(() => {
    const areas = this.catalog.areas();
    const build = (parentId: string | null): OrgNode[] =>
      areas.filter((area) => area.parentId === parentId).map((area) => ({ area, children: build(area.id) }));
    return build(null);
  });

  roleFor(area: ServiceArea): string {
    const name = area.name.toLocaleLowerCase('es');
    if (!area.parentId && name.includes('facultad')) return 'Decano';
    if (name.includes('educación') || name.includes('educacion')) return 'Coordinador';
    if (!area.parentId) return 'Director';
    return 'Responsable';
  }
}
