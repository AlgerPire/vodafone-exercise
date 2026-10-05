import { ApiError, errorFromResponse } from './errors';
import { codeChallengeS256, decodeJwtPayload, randomUnreserved } from './pkce';

describe('pkce', () => {
  it('builds an unpadded S256 challenge', async () => {
    const verifier = 'a'.repeat(43);
    const challenge = await codeChallengeS256(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).not.toMatch(/=/);
    expect(challenge).toHaveLength(43);
  });

  it('draws an unreserved verifier', () => {
    const value = randomUnreserved(64);
    expect(value).toHaveLength(64);
    expect(value).toMatch(/^[A-Za-z0-9._~-]+$/);
  });

  it('reads routing claims from an access token', () => {
    const payload = {
      customer_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      name: 'Jane Doe',
      email: 'jane@example.com',
      roles: ['CUSTOMER'],
      exp: 1_800_000_000,
    };
    const body = btoa(JSON.stringify(payload))
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/g, '');
    const claims = decodeJwtPayload(`header.${body}.sig`);
    expect(claims.roles).toEqual(['CUSTOMER']);
    expect(claims.customer_id).toBe(payload.customer_id);
    expect(claims.email).toBe('jane@example.com');
    expect(claims.name).toBe('Jane Doe');
  });
});

describe('problem detail', () => {
  it('surfaces field errors from a validation response', async () => {
    const response = new Response(
      JSON.stringify({
        type: 'about:blank',
        title: 'VALIDATION_ERROR',
        status: 400,
        detail: 'Request validation failed.',
        fieldErrors: {
          email: 'must be a well-formed email address',
          password: 'size must be between 12 and 128',
        },
      }),
      { status: 400 },
    );
    const error = await errorFromResponse(response);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.problem.detail).toBe('Request validation failed.');
    expect(error.problem.fieldErrors).toEqual({
      email: 'must be a well-formed email address',
      password: 'size must be between 12 and 128',
    });
  });

  it('treats a non-problem 403 as a role failure', async () => {
    const error = await errorFromResponse(new Response('no', { status: 403 }));
    expect(error.problem.detail).toBe('This role cannot open the page.');
  });
});
