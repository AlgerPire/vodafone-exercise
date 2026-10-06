import { environment } from '../../environments/environment';

/** Public OAuth client. Local dev uses the Angular proxy; production calls the Railway API. */
export const AUTH = {
  issuer: environment.issuer,
  clientId: environment.clientId,
  redirectUri: environment.redirectUri,
  scopes: 'customer.read customer.write',
} as const;

export function apiUrl(path: string): string {
  const base = environment.apiBase.replace(/\/$/, '');
  return `${base}${path}`;
}

/** Production calls Railway directly. Local dev stays on the Angular proxy. */
export function usesRemoteApi(): boolean {
  return environment.apiBase.length > 0;
}

export const REFRESH_TOKEN_KEY = 'cs.refresh_token';
export const CODE_VERIFIER_KEY = 'cs.code_verifier';
export const OAUTH_STATE_KEY = 'cs.oauth_state';

/** Refresh this many milliseconds before the access-token `exp` claim. */
export const REFRESH_SKEW_MS = 60_000;
