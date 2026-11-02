import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import type { TicketCategory } from '../../models/ticket.model';
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
  selector: 'app-categories-page',
  imports: [
    UiPageHeaderComponent,
    UiButtonComponent,
    UiFilterBarComponent,
    UiFieldComponent,
    UiSelectComponent,
    UiTableComponent,
    UiDialogComponent,
    UiCheckboxComponent,
    UiConfirmComponent,
    UiAlertComponent,
  ],
  templateUrl: './categories.page.html',
})
export class CategoriesPage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly route = inject(ActivatedRoute);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Categorías' }];
  readonly areaId = signal(this.route.snapshot.queryParamMap.get('area') ?? '');
  readonly status = signal('');
  readonly search = signal('');
  readonly selected = signal<TicketCategory | null>(null);
  readonly removing = signal<TicketCategory | null>(null);
  readonly notice = signal<string | null>(null);
  readonly name = signal('');
  readonly description = signal('');
  readonly categoryArea = signal('');
  readonly enabled = signal(true);
  readonly areaChoices = computed((): readonly UiSelectOption[] => [
    { value: '', label: 'Todas' },
    ...this.catalog.areas().map((area) => ({ value: area.id, label: `${area.code} · ${area.name}` })),
  ]);
  readonly statusChoices: readonly UiSelectOption[] = [
    { value: '', label: 'Todos' },
    { value: '1', label: 'Activa' },
    { value: '0', label: 'Inactiva' },
  ];
  readonly columns: readonly UiTableColumn[] = [
    { key: 'name', label: 'Categoría', sortable: true },
    { key: 'area', label: 'Área' },
    { key: 'visible', label: 'Visible para el solicitante' },
    { key: 'status', label: 'Estado' },
  ];
  readonly rows = computed(() => this.catalog.categories()
    .filter((category) => {
      if (this.areaId() && category.areaId !== this.areaId()) return false;
      if (this.status() === '1' && !category.enabled) return false;
      if (this.status() === '0' && category.enabled) return false;
      const query = this.search().trim().toLocaleLowerCase('es');
      if (query && !category.name.toLocaleLowerCase('es').includes(query)) return false;
      return true;
    })
    .map((category) => {
      const area = this.catalog.areas().find((item) => item.id === category.areaId);
      const visible = !!(area && area.enabled && area.receivesTickets && category.enabled);
      return {
        id: category.id,
        name: category.name,
        area: area ? `${area.code} · ${area.name}` : '—',
        visible: visible ? 'Sí' : 'No',
        status: category.enabled ? 'Activa' : 'Inactiva',
      };
    }));

  clearFilters(): void {
    this.areaId.set('');
    this.status.set('');
    this.search.set('');
  }

  openCreate(): void {
    this.fill({ id: '', areaId: this.areaId() || this.catalog.receivingAreas()[0]?.id || '', name: '', description: '', enabled: true });
  }

  open(row: UiTableRow): void {
    const category = this.categoryFrom(row);
    if (category) this.fill(category);
  }

  categoryFrom(row: UiTableRow): TicketCategory | null {
    return this.catalog.categories().find((item) => item.id === String(row['id'] ?? '')) ?? null;
  }

  async save(): Promise<void> {
    if (!this.categoryArea() || this.name().trim().length < 3) {
      this.notice.set('Elige un área y un nombre de categoría.');
      return;
    }
    const current = this.selected();
    await this.catalog.saveCategory({
      id: current?.id || crypto.randomUUID(),
      areaId: this.categoryArea(),
      name: this.name().trim(),
      description: this.description().trim(),
      enabled: this.enabled(),
    });
    this.selected.set(null);
  }

  async remove(): Promise<void> {
    const category = this.removing();
    if (category) await this.catalog.removeCategory(category.id);
    this.removing.set(null);
    this.selected.set(null);
  }

  private fill(category: TicketCategory): void {
    this.selected.set(category);
    this.name.set(category.name);
    this.description.set(category.description);
    this.categoryArea.set(category.areaId);
    this.enabled.set(category.enabled);
    this.notice.set(null);
  }
}
