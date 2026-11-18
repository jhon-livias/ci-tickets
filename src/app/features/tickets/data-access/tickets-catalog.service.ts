import { Injectable, computed, inject, signal } from '@angular/core';

import { TicketsAuthService } from '../../../core/auth/tickets-auth.service';
import { resolveTicketsRole } from '../../../core/auth/tickets-role';
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

const ticketsBaseUrl = '/api/v1/tickets';

export interface AreaMembershipView {
  readonly areaId: string;
  readonly code: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly canCreateTickets: boolean;
  readonly receivesTickets: boolean;
}

export interface TicketsAccess {
  readonly enrolled: boolean;
  readonly canCreateTickets: boolean;
  readonly receivesTickets: boolean;
  readonly memberships: readonly AreaMembershipView[];
}

interface AccountResult {
  readonly accountCreated: boolean;
  readonly username: string;
}

interface CatalogSnapshot {
  readonly areas: readonly ServiceArea[];
  readonly categories: readonly TicketCategory[];
  readonly team: readonly TeamMember[];
  readonly priorities: readonly PriorityLevel[];
}

@Injectable({ providedIn: 'root' })
export class TicketsCatalogService {
  private readonly auth = inject(TicketsAuthService);
  private readonly ticketsState = signal<readonly Ticket[]>([]);
  private readonly areasState = signal<readonly ServiceArea[]>([]);
  private readonly categoriesState = signal<readonly TicketCategory[]>([]);
  private readonly teamState = signal<readonly TeamMember[]>([]);
  private readonly prioritiesState = signal<readonly PriorityLevel[]>([]);
  private readonly profilePhone = signal('');
  private readonly profileDocument = signal('');
  private readonly profileEmail = signal('');
  private readonly profileCountry = signal('+51');
  private readonly accessState = signal<TicketsAccess>({ enrolled: false, canCreateTickets: false, receivesTickets: false, memberships: [] });
  private accessLoaded = false;

  readonly tickets = this.ticketsState.asReadonly();
  readonly areas = this.areasState.asReadonly();
  readonly categories = this.categoriesState.asReadonly();
  readonly team = this.teamState.asReadonly();
  readonly priorities = this.prioritiesState.asReadonly();
  readonly contactPhone = this.profilePhone.asReadonly();
  readonly contactDocument = this.profileDocument.asReadonly();
  readonly contactEmail = this.profileEmail.asReadonly();
  readonly contactCountry = this.profileCountry.asReadonly();
  readonly receivingAreas = computed(() => this.areasState().filter((area) => area.enabled && area.receivesTickets));
  readonly access = this.accessState.asReadonly();
  readonly myAreas = computed(() => this.accessState().memberships.filter((area) => area.enabled));
  readonly canSeeMine = computed(() => this.accessState().enrolled ? this.accessState().canCreateTickets : this.role() === 'requester');
  readonly canSeeCreate = computed(() => this.accessState().enrolled
    ? this.accessState().canCreateTickets
    : this.role() === 'requester' && this.areasState().some((area) => area.enabled && area.canCreateTickets));
  readonly canSeeQueue = computed(() => {
    if (this.accessState().enrolled) return this.accessState().receivesTickets;
    const role = this.role();
    return (role === 'assistant' || role === 'area_manager')
      && this.areasState().some((area) => area.enabled && area.code === 'TI' && area.receivesTickets);
  });

  ticketById(id: string): Ticket | null {
    return this.ticketsState().find((ticket) => ticket.id === id) ?? null;
  }

  async loadProfile(): Promise<void> {
    const response = await fetch('/api/v1/auth/profile', { credentials: 'include' });
    if (!response.ok) return;
    const payload = await response.json() as {
      documentNumber?: unknown;
      personalEmail?: unknown;
      email?: unknown;
      mobile?: unknown;
      mobileCountry?: unknown;
    };
    if (typeof payload.documentNumber === 'string') this.profileDocument.set(payload.documentNumber);
    const email = typeof payload.personalEmail === 'string' && payload.personalEmail
      ? payload.personalEmail
      : typeof payload.email === 'string' ? payload.email : '';
    this.profileEmail.set(email);
    if (typeof payload.mobile === 'string') this.profilePhone.set(payload.mobile);
    if (typeof payload.mobileCountry === 'string' && payload.mobileCountry) this.profileCountry.set(payload.mobileCountry);
  }

  async updatePhone(phone: string): Promise<void> {
    const mobile = phone.replace(/\D/g, '');
    await this.request<void>('PATCH', '/contact', {
      mobileCountry: this.profileCountry() || '+51',
      mobile,
    }, '/api/v1/auth/profile');
    this.profilePhone.set(mobile);
  }

  async ensureAccess(): Promise<void> {
    if (this.accessLoaded) return;
    await this.loadAccess();
  }

  async refresh(): Promise<void> {
    const [catalog, tickets] = await Promise.all([
      this.request<CatalogSnapshot>('GET', '/catalog'),
      this.request<readonly Ticket[]>('GET', ''),
      this.loadAccess(),
    ]);
    this.areasState.set(catalog.areas);
    this.categoriesState.set(catalog.categories);
    this.teamState.set(catalog.team);
    this.prioritiesState.set(catalog.priorities);
    this.ticketsState.set(tickets);
  }

  async createExternalTicket(input: CreateExternalTicketInput): Promise<Ticket> {
    const ticket = await this.request<Ticket>('POST', '', {
      areaId: input.areaId,
      about: input.about,
      otherName: input.otherName,
      otherDocument: input.otherDocument,
      categoryId: input.categoryId,
      description: input.description,
      attachmentNames: input.attachmentNames,
      ...(input.originAreaId ? { originAreaId: input.originAreaId } : {}),
    });
    await this.refresh();
    return this.ticketById(ticket.id) ?? ticket;
  }

  async createInternalTicket(input: CreateInternalTicketInput): Promise<Ticket> {
    const ticket = await this.request<Ticket>('POST', '/internal', {
      assignedName: input.assignedName,
      dueOn: input.dueOn,
      priority: input.priority,
      categoryName: input.categoryName,
      description: input.description,
      attachmentNames: input.attachmentNames,
    });
    await this.refresh();
    return this.ticketById(ticket.id) ?? ticket;
  }

  async reopenTicket(id: string, reason: string): Promise<void> {
    await this.request<void>('POST', `/${id}/reopen`, { reason });
    await this.refresh();
  }

  async changeStatus(
    id: string,
    status: TicketStatus,
    note: string,
    assignedName?: string,
    attachmentNames: readonly string[] = [],
  ): Promise<void> {
    await this.request<void>('POST', `/${id}/status`, { status, note, assignedName, attachmentNames });
    await this.refresh();
  }

  async updateInternalTicket(id: string, input: CreateInternalTicketInput): Promise<void> {
    await this.request<void>('PUT', `/internal/${id}`, {
      assignedName: input.assignedName,
      dueOn: input.dueOn,
      priority: input.priority,
      categoryName: input.categoryName,
      description: input.description,
    });
    await this.refresh();
  }

  async saveArea(area: ServiceArea): Promise<AccountResult> {
    const known = this.areasState().some((item) => item.id === area.id);
    const body = {
      parentId: area.parentId,
      code: area.code,
      name: area.name,
      responsibility: area.responsibility,
      managerName: area.managerName,
      managerDocument: area.managerDocument,
      managerEmail: area.managerEmail,
      receivesTickets: area.receivesTickets,
      allowsInternal: area.allowsInternal,
      canCreateTickets: area.canCreateTickets,
      enabled: area.enabled,
    };
    const result = known
      ? await this.request<AccountResult>('PUT', `/areas/${area.id}`, body)
      : await this.request<AccountResult>('POST', '/areas', body);
    await this.refresh();
    return result;
  }

  async removeArea(id: string): Promise<void> {
    await this.request<void>('DELETE', `/areas/${id}`);
    await this.refresh();
  }

  async saveCategory(category: TicketCategory): Promise<void> {
    const known = this.categoriesState().some((item) => item.id === category.id);
    const body = { areaId: category.areaId, name: category.name, description: category.description, enabled: category.enabled };
    if (known) await this.request<void>('PUT', `/categories/${category.id}`, body);
    else await this.request<void>('POST', '/categories', body);
    await this.refresh();
  }

  async removeCategory(id: string): Promise<void> {
    await this.request<void>('DELETE', `/categories/${id}`);
    await this.refresh();
  }

  async saveMember(member: TeamMember): Promise<AccountResult> {
    const known = this.teamState().some((item) => item.id === member.id);
    const body = {
      fullName: member.fullName,
      document: member.document,
      roleTitle: member.roleTitle,
      email: member.email,
      phone: member.phone,
      functions: member.functions,
      schedule: member.schedule,
      areaIds: member.areaIds,
    };
    const result = known
      ? await this.request<AccountResult>('PUT', `/team/${member.id}`, body)
      : await this.request<AccountResult>('POST', '/team', body);
    await this.refresh();
    return result;
  }

  async removeMember(id: string): Promise<void> {
    await this.request<void>('DELETE', `/team/${id}`);
    await this.refresh();
  }

  async addPriorityActivity(level: TicketPriority, activity: PriorityActivity): Promise<void> {
    await this.request<void>('POST', '/priorities/activities', { level, ...activity });
    await this.refresh();
  }

  async removePriorityActivity(id: string): Promise<void> {
    await this.request<void>('DELETE', `/priorities/activities/${id}`);
    await this.refresh();
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

  private role() {
    return resolveTicketsRole(this.auth.user());
  }

  private async loadAccess(): Promise<void> {
    const access = await this.request<TicketsAccess>('GET', '/access');
    this.accessState.set(access);
    this.accessLoaded = true;
  }

  private async request<T>(method: string, path: string, body?: unknown, base = ticketsBaseUrl): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      method,
      credentials: 'include',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...this.auth.csrfHeaders(),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(await apiError(response));
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) as T : undefined as T);
  }
}

const apiError = async (response: Response): Promise<string> => {
  try {
    return readableMessage(await response.json());
  } catch {
    return 'No pudimos completar la operación. Inténtalo nuevamente.';
  }
};

const readableMessage = (payload: unknown): string => {
  const raw = payload && typeof payload === 'object' ? (payload as { message?: unknown }).message : payload;
  const text = Array.isArray(raw)
    ? raw.filter((item): item is string => typeof item === 'string').join(' ')
    : typeof raw === 'string' ? raw : '';
  if (!text.trim() || /p20\d{2}|postgres|prisma|sqlstate/i.test(text)) {
    return 'No pudimos completar la operación. Inténtalo nuevamente.';
  }
  return text;
};
