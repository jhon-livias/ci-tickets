import { Component, computed, inject, signal } from '@angular/core';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { PRIORITY_LABELS } from '../../models/ticket-labels';
import type { TicketPriority } from '../../models/ticket.model';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-priorities-page',
  imports: [UiPageHeaderComponent, UiTableComponent, UiDialogComponent, UiButtonComponent, UiFieldComponent, UiSelectComponent],
  templateUrl: './priorities.page.html',
})
export class PrioritiesPage {
  private readonly catalog = inject(TicketsCatalogService);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Prioridades' }];
  readonly selected = signal<TicketPriority | null>(null);
  readonly editing = signal(false);
  readonly category = signal('');
  readonly activity = signal('');
  readonly estimate = signal('');
  readonly columns: readonly UiTableColumn[] = [
    { key: 'level', label: 'Prioridad' },
    { key: 'description', label: 'Cuándo se usa' },
    { key: 'count', label: 'Actividades', align: 'center' },
  ];
  readonly activityColumns: readonly UiTableColumn[] = [
    { key: 'category', label: 'Categoría' },
    { key: 'activity', label: 'Actividad' },
    { key: 'estimate', label: 'Tiempo estimado' },
  ];
  readonly rows = computed(() => this.catalog.priorities().map((item) => ({
    id: item.level,
    level: PRIORITY_LABELS[item.level],
    description: item.description,
    count: item.activities.length,
  })));
  readonly selectedLevel = computed(() => this.catalog.priorities().find((item) => item.level === this.selected()) ?? null);
  readonly activityRows = computed(() => this.selectedLevel()?.activities.map((item, index) => ({
    id: String(index),
    category: item.categoryName,
    activity: item.activity,
    estimate: item.estimate,
  })) ?? []);
  readonly categoryChoices = computed((): readonly UiSelectOption[] =>
    this.catalog.categories().map((item) => ({ value: item.name, label: item.name })),
  );

  open(row: UiTableRow): void {
    const level = String(row['id'] ?? '') as TicketPriority;
    this.selected.set(level);
    this.editing.set(false);
  }

  async addActivity(): Promise<void> {
    const level = this.selected();
    if (!level || !this.category() || this.activity().trim().length < 3 || !this.estimate().trim()) return;
    await this.catalog.addPriorityActivity(level, {
      categoryName: this.category(),
      activity: this.activity().trim(),
      estimate: this.estimate().trim(),
    });
    this.category.set('');
    this.activity.set('');
    this.estimate.set('');
    this.editing.set(false);
  }
}
