import { Component, computed, inject, signal } from '@angular/core';

import { TicketsCatalogService } from '../../data-access/tickets-catalog.service';
import type { TeamMember } from '../../models/ticket.model';
import { UiAlertComponent } from '../../../../shared/ui/alert/ui-alert.component';
import { UiButtonComponent } from '../../../../shared/ui/button/ui-button.component';
import { UiConfirmComponent } from '../../../../shared/ui/confirm/ui-confirm.component';
import { UiDialogComponent } from '../../../../shared/ui/dialog/ui-dialog.component';
import { UiFieldComponent } from '../../../../shared/ui/field/ui-field.component';
import { UiFilterBarComponent } from '../../../../shared/ui/filter-bar/ui-filter-bar.component';
import { UiPageHeaderComponent } from '../../../../shared/ui/page-header/ui-page-header.component';
import { UiTableComponent, type UiTableColumn, type UiTableRow } from '../../../../shared/ui/table/ui-table.component';

@Component({
  selector: 'app-team-page',
  imports: [UiPageHeaderComponent, UiButtonComponent, UiFilterBarComponent, UiFieldComponent, UiTableComponent, UiDialogComponent, UiConfirmComponent, UiAlertComponent],
  templateUrl: './team.page.html',
})
export class TeamPage {
  private readonly catalog = inject(TicketsCatalogService);
  readonly crumbs = [{ label: 'Atención UPRIT' }, { label: 'Equipo de TI' }];
  readonly nameQuery = signal('');
  readonly documentQuery = signal('');
  readonly selected = signal<TeamMember | null>(null);
  readonly removing = signal<TeamMember | null>(null);
  readonly fullName = signal('');
  readonly document = signal('');
  readonly roleTitle = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly functions = signal('');
  readonly schedule = signal('');
  readonly notice = signal<string | null>(null);
  readonly editing = signal(false);
  readonly creating = signal(false);
  readonly columns: readonly UiTableColumn[] = [
    { key: 'name', label: 'Nombres y apellidos', sortable: true },
    { key: 'document', label: 'DNI' },
    { key: 'role', label: 'Cargo' },
    { key: 'email', label: 'Correo' },
  ];
  readonly rows = computed(() => this.catalog.team()
    .filter((member) => {
      const name = `${member.fullName}`.toLocaleLowerCase('es');
      const query = this.nameQuery().trim().toLocaleLowerCase('es');
      const dni = this.documentQuery().trim();
      if (query && !name.includes(query)) return false;
      if (dni && !member.document.includes(dni)) return false;
      return true;
    })
    .map((member) => ({ id: member.id, name: member.fullName, document: member.document, role: member.roleTitle, email: member.email })));

  dialogTitle(member: TeamMember): string {
    if (member.isManager) return 'Responsable del área';
    if (!member.id) return 'Crear colaborador';
    return this.editing() ? 'Editar colaborador' : 'Ver colaborador';
  }

  openCreate(): void {
    this.creating.set(true);
    this.editing.set(true);
    this.selected.set({ id: '', fullName: '', document: '', roleTitle: '', email: '', phone: '', functions: '', schedule: '', isManager: false });
    this.fill(this.selected());
  }

  open(row: UiTableRow, edit: boolean): void {
    const member = this.catalog.team().find((item) => item.id === String(row['id'] ?? ''));
    if (!member) return;
    this.creating.set(false);
    this.editing.set(edit);
    this.selected.set(member);
    this.fill(member);
  }

  confirmRemoveMember(): void {
    const member = this.selected();
    if (member && !member.isManager) {
      this.removing.set(member);
      this.selected.set(null);
    }
  }

  confirmRemove(row: UiTableRow): void {
    const member = this.catalog.team().find((item) => item.id === String(row['id'] ?? ''));
    if (member && !member.isManager) this.removing.set(member);
  }

  async save(): Promise<void> {
    const current = this.selected();
    if (!current) return;
    if (this.fullName().trim().length < 3 || !/^\d{8}$/.test(this.document()) || this.roleTitle().trim().length < 3) {
      this.notice.set('Completa nombres, DNI de 8 dígitos y cargo.');
      return;
    }
    await this.catalog.saveMember({
      id: current.id || crypto.randomUUID(),
      fullName: this.fullName().trim(),
      document: this.document().trim(),
      roleTitle: current.isManager ? current.roleTitle : this.roleTitle().trim(),
      email: this.email().trim(),
      phone: this.phone().trim(),
      functions: this.functions().trim(),
      schedule: this.schedule().trim(),
      isManager: current.isManager,
    });
    this.selected.set(null);
    this.notice.set(null);
  }

  async remove(): Promise<void> {
    const member = this.removing();
    if (member) await this.catalog.removeMember(member.id);
    this.removing.set(null);
  }

  private fill(member: TeamMember | null): void {
    this.fullName.set(member?.fullName ?? '');
    this.document.set(member?.document ?? '');
    this.roleTitle.set(member?.roleTitle ?? '');
    this.email.set(member?.email ?? '');
    this.phone.set(member?.phone ?? '');
    this.functions.set(member?.functions ?? '');
    this.schedule.set(member?.schedule ?? '');
    this.notice.set(null);
  }
}
