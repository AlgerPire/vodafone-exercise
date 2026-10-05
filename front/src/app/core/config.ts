/** Public OAuth client. The browser stays on the Angular dev server. */
export const AUTH = {
  issuer: 'http://localhost:4200',
  clientId: 'presentation-client',
  redirectUri: 'http://localhost:4200/callback',
  scopes: 'customer.read customer.write',
} as const;

export const REFRESH_TOKEN_KEY = 'cs.refresh_token';
export const CODE_VERIFIER_KEY = 'cs.code_verifier';
export const OAUTH_STATE_KEY = 'cs.oauth_state';

/** Refresh this many milliseconds before the access-token `exp` claim. */
export const REFRESH_SKEW_MS = 60_000;
