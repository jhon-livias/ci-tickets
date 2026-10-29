import { Injectable, signal } from '@angular/core';

export interface TicketsSsoIdentity {
  readonly subject: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly roles: readonly string[];
}

const clientId = 'ci-tickets';
const verifierKey = 'tickets.sso.pkce-verifier';
const stateKey = 'tickets.sso.state';
const authBaseUrl = 'https://services.uprit.edu.pe/api/v1/auth';

@Injectable({ providedIn: 'root' })
export class SsoAuthService {
  readonly identity = signal<TicketsSsoIdentity | null>(null);

  beginLogin(): void {
    const verifier = randomUrlValue(64);
    const state = randomUrlValue(32);
    sessionStorage.setItem(verifierKey, verifier);
    sessionStorage.setItem(stateKey, state);
    void pkceChallenge(verifier).then((challenge) => {
      const query = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: callbackUri(),
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
      });
      window.location.assign(`${authBaseUrl}/sso/authorize?${query.toString()}`);
    });
  }

  async completeLogin(code: string, state: string | null): Promise<TicketsSsoIdentity> {
    const expectedState = sessionStorage.getItem(stateKey);
    const verifier = sessionStorage.getItem(verifierKey);
    sessionStorage.removeItem(stateKey);
    sessionStorage.removeItem(verifierKey);
    if (!expectedState || !verifier || !state || !safeEqual(expectedState, state)) {
      throw new Error('No se pudo validar el retorno seguro de inicio de sesión.');
    }
    const response = await fetch(`${authBaseUrl}/sso/token`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        code,
        redirect_uri: callbackUri(),
        code_verifier: verifier,
      }),
    });
    if (!response.ok) throw new Error('El código de inicio de sesión venció o no es válido.');
    const identity = await response.json() as TicketsSsoIdentity;
    this.identity.set(identity);
    return identity;
  }
}

const callbackUri = (): string => `${window.location.origin}/auth/callback`;
const randomUrlValue = (bytes: number): string => {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
};
const pkceChallenge = async (verifier: string): Promise<string> =>
  base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
const base64Url = (value: Uint8Array): string => {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};
const safeEqual = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};
