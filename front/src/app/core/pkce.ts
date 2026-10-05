import { AccessTokenClaims } from './models';

const UNRESERVED = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function randomUnreserved(length: number): string {
  if (length < 43 || length > 128) {
    throw new Error('PKCE values must be 43 to 128 characters.');
  }
  const chars: string[] = [];
  const limit = 256 - (256 % UNRESERVED.length);
  while (chars.length < length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    for (const byte of bytes) {
      if (byte >= limit) {
        continue;
      }
      chars.push(UNRESERVED[byte % UNRESERVED.length]);
      if (chars.length === length) {
        break;
      }
    }
  }
  return chars.join('');
}

export async function codeChallengeS256(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const bytes = new Uint8Array(digest);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '');
}

export function decodeJwtPayload(token: string): AccessTokenClaims {
  const segment = token.split('.')[1];
  if (!segment) {
    throw new Error('Access token payload is missing.');
  }
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const json = new TextDecoder().decode(Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)));
  return JSON.parse(json) as AccessTokenClaims;
}
