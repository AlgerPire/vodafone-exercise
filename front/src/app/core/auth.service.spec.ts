import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AUTH, CODE_VERIFIER_KEY, OAUTH_STATE_KEY } from './config';
import { AuthService } from './auth.service';

describe('AuthService sign-in redirect', () => {
  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('sends the browser to the authorization server without a client secret', async () => {
    const assigned: string[] = [];
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const auth = TestBed.inject(AuthService);

    await auth.beginSignIn((url) => assigned.push(url));

    expect(assigned).toHaveLength(1);
    const url = new URL(assigned[0] ?? '');
    expect(`${url.origin}${url.pathname}`).toBe(`${AUTH.issuer}/oauth2/authorize`);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe(AUTH.clientId);
    expect(url.searchParams.get('redirect_uri')).toBe(AUTH.redirectUri);
    expect(url.searchParams.get('scope')).toBe(AUTH.scopes);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(url.searchParams.has('client_secret')).toBe(false);
    expect(sessionStorage.getItem(OAUTH_STATE_KEY)).toBe(url.searchParams.get('state'));
    expect(sessionStorage.getItem(CODE_VERIFIER_KEY)?.length).toBeGreaterThanOrEqual(43);
    expect(localStorage.length).toBe(0);
  });
});
