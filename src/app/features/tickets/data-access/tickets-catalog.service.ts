import { Injectable, computed, signal } from '@angular/core';

import { canReopenTicket, nextTicketCode } from '../models/ticket-labels';
import type {
  CreateExternalTicketInput,
  CreateInternalTicketInput,
  PriorityActivity,
  PriorityLevel,
  ServiceArea,
  TeamMember,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '../models/ticket.model';
import { seedAreas, seedCategories, seedPriorities, seedTeam, seedTickets } from './tickets-catalog.seed';

@Injectable({ providedIn: 'root' })
export class TicketsCatalogService {
  private readonly ticketsState = signal<readonly Ticket[]>(seedTickets);
  private readonly areasState = signal<readonly ServiceArea[]>(seedAreas);
  private readonly categoriesState = signal<readonly TicketCategory[]>(seedCategories);
  private readonly teamState = signal<readonly TeamMember[]>(seedTeam);
  private readonly prioritiesState = signal<readonly PriorityLevel[]>(seedPriorities);
  private readonly profilePhone = signal('987123456');

  readonly tickets = this.ticketsState.asReadonly();
  readonly areas = this.areasState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly team = this.teamState.asReadonly();
  readonly priorities = this.prioritiesState.asReadonly();
  readonly contactPhone = this.profilePhone.asReadonly();
  readonly receivingAreas = computed(() => this.areasState().filter((area) => area.enabled && area.receivesTickets));

  ticketById(id: string): Ticket | null {
    return this.ticketsState().find((ticket) => ticket.id === id) ?? null;
  }

  updatePhone(phone: string): void {
    this.profilePhone.set(phone);
  }

  createExternalTicket(input: CreateExternalTicketInput, requesterName: string, requesterRole: string): Ticket {
    const area = this.areasState().find((item) => item.id === input.areaId);
    const category = this.categoriesState().find((item) => item.id === input.categoryId);
    if (!area || !category) throw new Error('No pudimos registrar el ticket. Revisa el área y la categoría.');
    const now = new Date();
    const aboutLabel = input.about === 'self'
      ? `Yo mismo/a · ${requesterName}`
      : `${input.about === 'student' ? 'Alumno' : 'Docente'} · ${input.otherName}`;
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code: nextTicketCode(area.code, this.ticketsState().map((item) => item.code), now),
      kind: 'EXTERNAL',
      createdAt: now.toISOString(),
      academicArea: '',
      aboutLabel,
      categoryName: category.name,
      status: 'CREATED',
      estimate: this.estimateFor(category.name),
      priority: this.priorityFor(category.name),
      requesterName,
      requesterRole,
      assignedName: null,
      dueOn: null,
      description: input.description,
      receiverResponse: '',
      resolvedAt: null,
      attachmentNames: input.attachmentNames,
      destinationAreaCode: area.code,
      emittedInternally: false,
      history: [{ status: 'CREATED', at: now.toISOString(), actorName: requesterName, actorArea: requesterRole }],
    };
    this.ticketsState.update((items) => [ticket, ...items]);
    return ticket;
  }

  createInternalTicket(input: CreateInternalTicketInput, actorName: string): Ticket {
    const now = new Date();
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code: nextTicketCode('TI', this.ticketsState().map((item) => item.code), now),
      kind: 'INTERNAL',
      createdAt: now.toISOString(),
      academicArea: '',
      aboutLabel: `Responsable de TI · ${actorName}`,
      categoryName: input.categoryName,
      status: 'CREATED',
      estimate: this.estimateFor(input.categoryName),
      priority: input.priority,
      requesterName: actorName,
      requesterRole: 'Responsable de TI',
      assignedName: input.assignedName,
      dueOn: input.dueOn,
      description: input.description,
      receiverResponse: '',
      resolvedAt: null,
      attachmentNames: input.attachmentNames,
      destinationAreaCode: 'TI',
      emittedInternally: true,
      history: [{ status: 'CREATED', at: now.toISOString(), actorName, actorArea: 'TI' }],
    };
    this.ticketsState.update((items) => [ticket, ...items]);
    return ticket;
  }

  reopenTicket(id: string, reason: string, actorName: string): void {
    this.patchTicket(id, (ticket) => {
      if (!canReopenTicket(ticket.resolvedAt, ticket.status)) {
        throw new Error('El plazo de reapertura ya venció.');
      }
      return {
        ...ticket,
        status: 'REOPENED',
        estimate: 'Pendiente de nueva revisión',
        description: `${ticket.description}\n\nMotivo de reapertura: ${reason}`,
        history: [...ticket.history, { status: 'REOPENED', at: new Date().toISOString(), actorName, actorArea: 'Solicitante' }],
      };
    });
  }

  changeStatus(id: string, status: TicketStatus, actorName: string, note: string, assignedName?: string): void {
    this.patchTicket(id, (ticket) => ({
      ...ticket,
      status,
      assignedName: assignedName ?? ticket.assignedName,
      receiverResponse: note || ticket.receiverResponse,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : ticket.resolvedAt,
      history: [...ticket.history, { status, at: new Date().toISOString(), actorName, actorArea: 'TI', toName: assignedName }],
    }));
  }

  saveArea(area: ServiceArea): void {
    this.areasState.update((items) => {
      const index = items.findIndex((item) => item.id === area.id);
      if (index < 0) return [area, ...items];
      return items.map((item) => (item.id === area.id ? area : item));
    });
  }

  removeArea(id: string): void {
    this.areasState.update((items) => items.filter((item) => item.id !== id && item.parentId !== id));
    this.categoriesState.update((items) => items.filter((item) => item.areaId !== id));
  }

  saveCategory(category: TicketCategory): void {
    this.categoriesState.update((items) => {
      const index = items.findIndex((item) => item.id === category.id);
      if (index < 0) return [category, ...items];
      return items.map((item) => (item.id === category.id ? category : item));
    });
  }

  removeCategory(id: string): void {
    this.categoriesState.update((items) => items.filter((item) => item.id !== id));
  }

  saveMember(member: TeamMember): void {
    this.teamState.update((items) => {
      const index = items.findIndex((item) => item.id === member.id);
      if (index < 0) return [...items, member];
      return items.map((item) => (item.id === member.id ? member : item));
    });
  }

  removeMember(id: string): void {
    this.teamState.update((items) => items.filter((item) => item.id !== id || item.isManager));
  }

  addPriorityActivity(level: TicketPriority, activity: PriorityActivity): void {
    this.prioritiesState.update((items) => items.map((item) =>
      item.level === level ? { ...item, activities: [...item.activities, activity] } : item,
    ));
  }

  oldestPendingDate(): string {
    const pending = this.ticketsState().filter((ticket) => ticket.status === 'CREATED' || ticket.status === 'IN_REVIEW');
    if (!pending.length) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    return pending
      .map((ticket) => ticket.createdAt.slice(0, 10))
      .sort()[0] ?? new Date().toISOString().slice(0, 10);
  }

  private estimateFor(categoryName: string): string {
    for (const level of this.prioritiesState()) {
      const match = level.activities.find((activity) => activity.categoryName === categoryName);
      if (match) return match.estimate;
    }
    return 'Según disponibilidad';
  }

  private priorityFor(categoryName: string): TicketPriority {
    for (const level of this.prioritiesState()) {
      if (level.activities.some((activity) => activity.categoryName === categoryName)) return level.level;
    }
    return 'MEDIUM';
  }

  private patchTicket(id: string, update: (ticket: Ticket) => Ticket): void {
    const current = this.ticketById(id);
    if (!current) throw new Error('No encontramos el ticket.');
    const next = update(current);
    this.ticketsState.update((items) => items.map((item) => (item.id === id ? next : item)));
  }
}
