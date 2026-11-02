import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import type { ServiceArea } from '../../models/ticket.model';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiCheckboxComponent } from '../../../../shared/ui/checkbox/ui-checkbox.component';
import { UiConfirmComponent } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-areas-page',
  imports: [
    UiPageHeaderComponent,
    UiButtonComponent,
    UiFilterBarComponent,
    UiFieldComponent,
    UiTableComponent,
    UiDialogComponent,
    UiSelectComponent,
    UiCheckboxComponent,
    UiConfirmComponent,
    UiAlertComponent,
  ],
  templateUrl: './areas.page.html',
})
export class AreasPage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly router = inject(Router);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Áreas' }];
  readonly query = signal('');
  readonly selected = signal<ServiceArea | null>(null);
  readonly removing = signal<ServiceArea | null>(null);
  readonly resetting = signal<ServiceArea | null>(null);
  readonly notice = signal<string | null>(null);
  readonly code = signal('');
  readonly name = signal('');
  readonly parentId = signal('');
  readonly responsibility = signal('');
  readonly managerName = signal('');
  readonly managerDocument = signal('');
  readonly managerEmail = signal('');
  readonly enabled = signal(true);
  readonly receivesTickets = signal(false);
  readonly allowsInternal = signal(false);
  readonly canCreateTickets = signal(false);
  readonly columns: readonly UiTableColumn[] = [
    { key: 'code', label: 'Siglas', sortable: true },
    { key: 'name', label: 'Área' },
    { key: 'parent', label: 'Área superior' },
    { key: 'internal', label: 'Ticket interno' },
    { key: 'receives', label: 'Recibe tickets' },
    { key: 'creates', label: 'Crea ticket' },
    { key: 'categories', label: 'Categorías', align: 'center' },
    { key: 'status', label: 'Estado' },
  ];
  readonly parentOptions = computed((): readonly UiSelectOption[] => [
    { value: '', label: 'Área principal' },
    ...this.catalog.areas()
      .filter((area) => area.id !== this.selected()?.id)
      .map((area) => ({ value: area.id, label: `${area.code} · ${area.name}` })),
  ]);
  readonly rows = computed(() => {
    const q = this.query().trim().toLocaleLowerCase('es');
    return this.catalog.areas()
      .filter((area) => `${area.code} ${area.name} ${area.responsibility}`.toLocaleLowerCase('es').includes(q))
      .map((area) => ({
        id: area.id,
        code: area.code,
        name: area.name,
        parent: this.catalog.areas().find((item) => item.id === area.parentId)?.name ?? 'Área principal',
        internal: area.allowsInternal ? 'Sí' : 'No',
        receives: area.receivesTickets ? 'Sí' : 'No',
        creates: area.canCreateTickets ? 'Sí' : 'No',
        categories: this.catalog.categories().filter((category) => category.areaId === area.id).length,
        status: area.enabled ? 'Activa' : 'Inactiva',
      }));
  });

  openCreate(): void {
    this.fill({
      id: '',
      parentId: null,
      code: '',
      name: '',
      responsibility: '',
      managerName: '',
      managerDocument: '',
      managerEmail: '',
      receivesTickets: false,
      allowsInternal: false,
      canCreateTickets: false,
      enabled: true,
    });
  }

  open(row: UiTableRow): void {
    const area = this.catalog.areas().find((item) => item.id === String(row['id'] ?? ''));
    if (area) this.fill(area);
  }

  save(): void {
    if (!/^[A-Z]{2,6}$/.test(this.code().trim()) || this.name().trim().length < 3) {
      this.notice.set('Usa siglas de 2 a 6 letras y un nombre de área.');
      return;
    }
    const current = this.selected();
    this.catalog.saveArea({
      id: current?.id || crypto.randomUUID(),
      parentId: this.parentId() || null,
      code: this.code().trim().toUpperCase(),
      name: this.name().trim(),
      responsibility: this.responsibility().trim(),
      managerName: this.managerName().trim(),
      managerDocument: this.managerDocument().trim(),
      managerEmail: this.managerEmail().trim(),
      receivesTickets: this.receivesTickets(),
      allowsInternal: this.allowsInternal(),
      canCreateTickets: this.canCreateTickets(),
      enabled: this.enabled(),
    });
    this.selected.set(null);
  }

  remove(): void {
    const area = this.removing();
    if (area) this.catalog.removeArea(area.id);
    this.removing.set(null);
    this.selected.set(null);
  }

  catalogArea(row: UiTableRow): ServiceArea | null {
    return this.catalog.areas().find((item) => item.id === String(row['id'] ?? '')) ?? null;
  }

  goCategories(): void {
    const area = this.selected();
    this.selected.set(null);
    void this.router.navigate(['/categorias'], { queryParams: area ? { area: area.id } : {} });
  }

  private fill(area: ServiceArea): void {
    this.selected.set(area);
    this.code.set(area.code);
    this.name.set(area.name);
    this.parentId.set(area.parentId ?? '');
    this.responsibility.set(area.responsibility);
    this.managerName.set(area.managerName);
    this.managerDocument.set(area.managerDocument);
    this.managerEmail.set(area.managerEmail);
    this.enabled.set(area.enabled);
    this.receivesTickets.set(area.receivesTickets);
    this.allowsInternal.set(area.allowsInternal);
    this.canCreateTickets.set(area.canCreateTickets);
    this.notice.set(null);
  }
}
