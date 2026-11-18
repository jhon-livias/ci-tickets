import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormRoot, form, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import { UiDropzoneComponent } from '../../../../shared/ui/dropzone/ui-dropzone.component';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiSelectComponent, type UiSelectOption } from '../../../../shared/ui/select/ui-select.component';

interface CreateTicketDraft {
  originAreaId: string;
  areaId: string;
  about: string;
  otherName: string;
  otherDocument: string;
  categoryId: string;
  description: string;
}

@Component({
  selector: 'app-create-ticket-page',
  imports: [FormRoot, UiPageHeaderComponent, UiSelectComponent, UiFieldComponent, UiButtonComponent, UiAlertComponent, UiConfirmComponent, UiDropzoneComponent],
  templateUrl: './create-ticket.page.html',
})
export class CreateTicketPage {
  private readonly catalog = inject(TicketsCatalogService);
  private readonly router = inject(Router);
  readonly draft = signal<CreateTicketDraft>({
    originAreaId: '',
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
  readonly files = signal<readonly File[]>([]);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly notice = signal<string | null>(null);
  readonly createdCode = signal<string | null>(null);
  readonly crumbs = [{ label: 'Atención UPRIT', href: '/mis-tickets' }, { label: 'Crear ticket' }];
  readonly originOptions = computed((): readonly UiSelectOption[] =>
    this.catalog.myAreas()
      .filter((area) => area.canCreateTickets)
      .map((area) => ({ value: area.areaId, label: `${area.code} · ${area.name}` })),
  );
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
  readonly errors = computed(() => {
    if (!this.submitted()) return {} as Record<string, string>;
    const data = this.draft();
    const description = data.description.trim();
    return {
      originAreaId: this.originOptions().length > 0 && !data.originAreaId ? 'Selecciona el área a la que perteneces.' : '',
      areaId: data.areaId ? '' : 'Selecciona el área de destino.',
      about: data.about ? '' : 'Indica quién tiene el problema.',
      otherName: this.thirdParty() && data.otherName.trim().length < 3 ? 'Escribe el nombre de la persona afectada.' : '',
      otherDocument: this.thirdParty() && !/^\d{8}$/.test(data.otherDocument.trim()) ? 'El DNI debe tener 8 dígitos.' : '',
      categoryId: data.categoryId ? '' : 'Selecciona una categoría.',
      description: description.length === 0 ? 'Describe el problema.' : description.length < 10 ? 'La descripción debe tener al menos 10 caracteres.' : '',
    };
  });

  constructor() {
    effect(() => {
      const areas = this.catalog.receivingAreas();
      const preferred = areas.find((area) => area.code === 'TI') ?? areas[0];
      const origins = this.originOptions();
      const current = this.draft();
      if (preferred && !current.areaId) this.draft.update((draft) => ({ ...draft, areaId: preferred.id }));
      if (origins.length === 1 && current.originAreaId !== origins[0]?.value) {
        this.draft.update((draft) => ({ ...draft, originAreaId: origins[0]?.value ?? '' }));
      }
    });
  }

  patch(partial: Partial<CreateTicketDraft>): void {
    this.draft.update((current) => ({ ...current, ...partial }));
  }

  resetForm(): void {
    const areas = this.catalog.receivingAreas();
    const origins = this.originOptions();
    this.draft.set({
      originAreaId: origins.length === 1 ? origins[0]?.value ?? '' : '',
      areaId: (areas.find((area) => area.code === 'TI') ?? areas[0])?.id ?? '',
      about: '',
      otherName: '',
      otherDocument: '',
      categoryId: '',
      description: '',
    });
    this.files.set([]);
    this.notice.set(null);
    this.submitted.set(false);
  }

  async submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (this.submitting()) return;
    this.ticketForm().markAsTouched();
    this.submitted.set(true);
    const data = this.draft();
    if (Object.values(this.errors()).some(Boolean) || this.ticketForm().invalid()) {
      this.notice.set('Revisa los datos marcados para continuar.');
      return;
    }
    if (!this.areaOptions().length) {
      this.notice.set('No hay áreas disponibles para recibir el ticket.');
      return;
    }
    if (!this.categoryOptions().length) {
      this.notice.set('El área elegida no tiene categorías disponibles.');
      return;
    }
    this.submitting.set(true);
    try {
      const ticket = await this.catalog.createExternalTicket({
        areaId: data.areaId,
        originAreaId: data.originAreaId || undefined,
        about: data.about as 'self' | 'student' | 'teacher',
        otherName: data.otherName.trim(),
        otherDocument: data.otherDocument.trim(),
        categoryId: data.categoryId,
        description: data.description.trim(),
        attachmentNames: this.files().map((file) => file.name),
      });
      this.createdCode.set(ticket.code);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No pudimos registrar el ticket.');
    } finally {
      this.submitting.set(false);
    }
  }

  finish(): void {
    this.createdCode.set(null);
    void this.router.navigateByUrl('/mis-tickets');
  }
}
