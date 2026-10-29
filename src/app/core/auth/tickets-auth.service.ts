import { Injectable, signal } from '@angular/core';

export interface TicketsUser {
  readonly id: string;
  readonly username: string;
  readonly displayName: string | null;
}

interface LoginResponse {
  readonly user: { readonly id: string; readonly username: string; readonly profile: { readonly firstName: string; readonly paternalLastName: string } | null };
}

const authBaseUrl = 'https://services.uprit.edu.pe/api/v1/auth';

@Injectable({ providedIn: 'root' })
export class TicketsAuthService {
  readonly user = signal<TicketsUser | null>(null);

  async login(username: string, password: string, recaptchaToken: string): Promise<void> {
    const response = await fetch(`${authBaseUrl}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, recaptchaToken }),
    });
    if (!response.ok) throw new Error('No pudimos iniciar sesión. Verifica tus credenciales e inténtalo nuevamente.');
    this.user.set(toUser(await response.json() as unknown));
  }
}

const toUser = (value: unknown): TicketsUser => {
  if (!value || typeof value !== 'object') throw new Error('Respuesta de autenticación inválida.');
  const user = (value as Record<string, unknown>)['user'];
  if (!user || typeof user !== 'object') throw new Error('Respuesta de autenticación inválida.');
  const candidate = user as Record<string, unknown>;
  if (typeof candidate['id'] !== 'string' || typeof candidate['username'] !== 'string') {
    throw new Error('Respuesta de autenticación inválida.');
  }
  const profile = candidate['profile'];
  const displayName = profile && typeof profile === 'object' &&
    typeof (profile as Record<string, unknown>)['firstName'] === 'string' &&
    typeof (profile as Record<string, unknown>)['paternalLastName'] === 'string'
    ? `${(profile as Record<string, string>)['firstName']} ${(profile as Record<string, string>)['paternalLastName']}` : null;
  return { id: candidate['id'], username: candidate['username'], displayName };
};
