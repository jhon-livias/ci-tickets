import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormRoot, form, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

interface CreateTicketDraft {
  areaId: string;
  about: string;
  otherName: string;
  otherDocument: string;
  categoryId: string;
  description: string;
}

@Component({
  selector: 'app-create-ticket-page',
  imports: [FormRoot, UiPageHeaderComponent, UiSelectComponent, UiFieldComponent, UiButtonComponent, UiAlertComponent, UiConfirmComponent],
  templateUrl: './create-ticket.page.html',
})
export class CreateTicketPage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly router = inject(Router);
  readonly draft = signal<CreateTicketDraft>({
    areaId: this.catalog.receivingAreas()[0]?.id ?? '',
    about: '',
    otherName: '',
    otherDocument: '',
    categoryId: '',
    description: '',
  });
  readonly ticketForm = form(this.draft, (path) => {
    required(path.areaId, { message: 'Selecciona el área de destino.' });
    required(path.about, { message: 'Indica quién tiene el problema.' });
    required(path.categoryId, { message: 'Selecciona una categoría.' });
    required(path.description, { message: 'Describe el problema.' });
    minLength(path.description, 10, { message: 'La descripción debe tener al menos 10 caracteres.' });
  });
  readonly files = signal<readonly string[]>([]);
  readonly notice = signal<string | null>(null);
  readonly createdCode = signal<string | null>(null);
  readonly crumbs = [{ label: 'Atención UPRIT', href: '/mis-tickets' }, { label: 'Crear ticket' }];
  readonly areaOptions = computed((): readonly UiSelectOption[] =>
    this.catalog.receivingAreas().map((area) => ({ value: area.id, label: `${area.code} · ${area.name}` })),
  );
  readonly aboutOptions: readonly UiSelectOption[] = [
    { value: 'self', label: 'Yo mismo/a' },
    { value: 'student', label: 'Alumno' },
    { value: 'teacher', label: 'Docente' },
  ];
  readonly categoryOptions = computed((): readonly UiSelectOption[] =>
    this.catalog.categories()
      .filter((category) => category.enabled && category.areaId === this.draft().areaId)
      .map((category) => ({ value: category.id, label: category.name })),
  );
  readonly thirdParty = computed(() => this.draft().about === 'student' || this.draft().about === 'teacher');

  constructor() {
    effect(() => {
      const areas = this.catalog.receivingAreas();
      const preferred = areas.find((area) => area.code === 'TI') ?? areas[0];
      if (!preferred) return;
      const current = this.draft();
      if (!current.areaId) this.draft.update((draft) => ({ ...draft, areaId: preferred.id }));
    });
  }

  patch(partial: Partial<CreateTicketDraft>): void {
    this.draft.update((current) => ({ ...current, ...partial }));
  }

  onFiles(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files) return;
    const names = [...input.files].slice(0, 5).map((file) => file.name);
    this.files.set(names);
  }

  resetForm(): void {
    const areas = this.catalog.receivingAreas();
    this.draft.set({
      areaId: (areas.find((area) => area.code === 'TI') ?? areas[0])?.id ?? '',
      about: '',
      otherName: '',
      otherDocument: '',
      categoryId: '',
      description: '',
    });
    this.files.set([]);
    this.notice.set(null);
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    this.ticketForm().markAsTouched();
    const data = this.draft();
    if (this.thirdParty() && (data.otherName.trim().length < 3 || !/^\d{8}$/.test(data.otherDocument))) {
      this.notice.set('Completa el nombre y el DNI de 8 dígitos de la persona afectada.');
      return;
    }
    if (this.ticketForm().invalid()) {
      this.notice.set('Revisa los datos marcados para continuar.');
      return;
    }
    try {
      const ticket = await this.catalog.createExternalTicket({
        areaId: data.areaId,
        about: data.about as 'self' | 'student' | 'teacher',
        otherName: data.otherName.trim(),
        otherDocument: data.otherDocument.trim(),
        categoryId: data.categoryId,
        description: data.description.trim(),
        attachmentNames: this.files(),
      });
      this.createdCode.set(ticket.code);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No pudimos registrar el ticket.');
    }
  }

  finish(): void {
    this.createdCode.set(null);
    void this.router.navigateByUrl('/mis-tickets');
  }
}
