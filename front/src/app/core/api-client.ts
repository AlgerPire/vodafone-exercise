import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { ApiError, errorFromResponse } from './errors';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
    const headers = new Headers(init.headers);
    const token = this.auth.token();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
      response = await fetch(path, { ...init, headers });
    } catch {
      throw new ApiError(0, {
        title: 'NETWORK',
        status: 0,
        detail: 'The API could not be reached. Start it on http://localhost:8080.',
      });
    }

    if (response.status === 401 && allowRefresh) {
      const refreshed = await this.auth.refresh();
      if (refreshed) {
        return this.request(path, init, false);
      }
      this.auth.clearSession();
      await this.router.navigate(['/login'], { queryParams: { reason: 'session-ended' } });
      throw new ApiError(401, {
        title: 'UNAUTHORIZED',
        status: 401,
        detail: 'Sign in again.',
      });
    }

    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    if (response.status === 204) {
      return undefined as T;
    }
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }
}
