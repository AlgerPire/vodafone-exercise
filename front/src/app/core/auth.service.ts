import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AUTH,
  CODE_VERIFIER_KEY,
  OAUTH_STATE_KEY,
  REFRESH_SKEW_MS,
  REFRESH_TOKEN_KEY,
} from './config';
import { errorFromResponse } from './errors';
import { AccessTokenClaims, TokenResponse } from './models';
import { codeChallengeS256, decodeJwtPayload, randomUnreserved } from './pkce';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly accessToken = signal<string | null>(null);
  private readonly claimsState = signal<AccessTokenClaims | null>(null);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  readonly claims = this.claimsState.asReadonly();
  readonly signedIn = computed(() => this.accessToken() !== null);
  readonly admin = computed(() => this.claimsState()?.roles?.includes('ADMIN') ?? false);
  readonly displayName = computed(() => this.claimsState()?.name || 'Account');

  token(): string | null {
    return this.accessToken();
  }

  homeUrl(): string {
    return this.admin() ? '/admin/customers' : '/account';
  }

  /** Restore an in-memory access token from the session refresh token, if one exists. */
  restore(): Promise<boolean> {
    if (this.accessToken()) {
      return Promise.resolve(true);
    }
    if (!sessionStorage.getItem(REFRESH_TOKEN_KEY)) {
      return Promise.resolve(false);
    }
    return this.refresh();
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const csrf = await this.ensureCsrfCookie();
    const response = await fetch('/session-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'X-XSRF-TOKEN': csrf,
      },
      credentials: 'same-origin',
      body: new URLSearchParams({ username: email.trim(), password }),
    });
    if (response.status === 403) {
      throw new Error('Sign-in was rejected. Reload the page and try again.');
    }
    if (!response.ok) {
      let detail = 'Email or password is incorrect.';
      try {
        const payload = (await response.json()) as { detail?: string };
        if (payload.detail) {
          detail = payload.detail;
        }
      } catch {
        // Keep the fallback message when the response is not JSON.
      }
      throw new Error(detail);
    }
    await this.beginSignIn();
  }

  async beginSignIn(navigate: (url: string) => void = assignBrowserLocation): Promise<void> {
    const verifier = randomUnreserved(64);
    const state = randomUnreserved(43);
    sessionStorage.setItem(CODE_VERIFIER_KEY, verifier);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
    const challenge = await codeChallengeS256(verifier);
    const url = new URL('/oauth2/authorize', AUTH.issuer);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', AUTH.clientId);
    url.searchParams.set('redirect_uri', AUTH.redirectUri);
    url.searchParams.set('scope', AUTH.scopes);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);
    navigate(url.toString());
  }

  async completeSignIn(code: string, state: string): Promise<void> {
    const expected = sessionStorage.getItem(OAUTH_STATE_KEY);
    const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
    if (!expected || !verifier || expected !== state) {
      this.clearPkce();
      throw new Error('Sign-in state did not match this browser session. Start again.');
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: AUTH.redirectUri,
      client_id: AUTH.clientId,
      code_verifier: verifier,
    });
    const response = await fetch('/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      this.clearPkce();
      throw await errorFromResponse(response);
    }
    const tokens = (await response.json()) as TokenResponse;
    this.clearPkce();
    this.applyTokens(tokens);
  }

  refresh(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshOnce().finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  async signOut(): Promise<void> {
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    const csrf = readCookie('XSRF-TOKEN');
    if (csrf) {
      try {
        await fetch('/session-logout', {
          method: 'POST',
          headers: { 'X-XSRF-TOKEN': csrf },
          credentials: 'same-origin',
        });
      } catch {
        // The local session is still cleared below.
      }
    }
    if (refreshToken) {
      const body = new URLSearchParams({
        token: refreshToken,
        token_type_hint: 'refresh_token',
        client_id: AUTH.clientId,
      });
      try {
        await fetch('/oauth2/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });
      } catch {
        // The local session is still cleared below.
      }
    }
    this.clearSession();
  }

  clearSession(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.accessToken.set(null);
    this.claimsState.set(null);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    this.clearPkce();
  }

  private async refreshOnce(): Promise<boolean> {
    const current = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!current) {
      this.clearSession();
      return false;
    }
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current,
      client_id: AUTH.clientId,
    });
    let response: Response;
    try {
      response = await fetch('/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    } catch {
      this.clearSession();
      return false;
    }
    if (!response.ok) {
      this.clearSession();
      return false;
    }
    const tokens = (await response.json()) as TokenResponse;
    if (!tokens.refresh_token) {
      this.clearSession();
      return false;
    }
    this.applyTokens(tokens);
    return true;
  }

  private applyTokens(tokens: TokenResponse): void {
    if (!tokens.access_token) {
      throw new Error('The token response did not include an access token.');
    }
    const claims = decodeJwtPayload(tokens.access_token);
    this.accessToken.set(tokens.access_token);
    if (tokens.refresh_token) {
      sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
    this.claimsState.set(claims);
    if (typeof claims.exp === 'number') {
      this.scheduleRefresh(claims.exp);
    }
  }

  private scheduleRefresh(exp: number): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
    }
    const delay = Math.max(0, exp * 1000 - Date.now() - REFRESH_SKEW_MS);
    this.refreshTimer = setTimeout(() => {
      void this.refresh().then((ok) => {
        if (!ok) {
          void this.router.navigate(['/login'], { queryParams: { reason: 'session-ended' } });
        }
      });
    }, delay);
  }

  private clearPkce(): void {
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
  }

  private async ensureCsrfCookie(): Promise<string> {
    const existing = readCookie('XSRF-TOKEN');
    if (existing) {
      return existing;
    }
    const response = await fetch('/csrf', { credentials: 'same-origin' });
    if (response.ok) {
      try {
        const payload = (await response.json()) as { token?: string };
        if (payload.token) {
          return payload.token;
        }
      } catch {
        // Fall through to the cookie set by the same response.
      }
    }
    const token = readCookie('XSRF-TOKEN');
    if (!token) {
      throw new Error('Sign-in could not start. Reload the page and try again.');
    }
    return token;
  }
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const match = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  if (!match) {
    return null;
  }
  return decodeURIComponent(match.slice(prefix.length));
}

function assignBrowserLocation(url: string): void {
  window.location.assign(url);
}
