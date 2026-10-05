import { inject, Injectable } from '@angular/core';
import { ApiClient } from './api-client';
import {
  Customer,
  CustomerPage,
  CustomerRole,
  HealthResponse,
  MessageResponse,
  ProfileUpdateRequest,
  RegisterRequest,
  RegisterResponse,
} from './models';

@Injectable({ providedIn: 'root' })
export class CustomerApi {
  private readonly api = inject(ApiClient);

  health(): Promise<HealthResponse> {
    return this.api.request<HealthResponse>('/actuator/health', {
      signal: AbortSignal.timeout(4000),
    });
  }

  register(body: RegisterRequest): Promise<RegisterResponse> {
    return this.api.request<RegisterResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  verifyEmail(token: string): Promise<MessageResponse> {
    const query = new URLSearchParams({ token });
    return this.api.request<MessageResponse>(`/api/v1/auth/verify-email?${query.toString()}`);
  }

  me(): Promise<Customer> {
    return this.api.request<Customer>('/api/v1/customers/me');
  }

  updateMe(body: ProfileUpdateRequest): Promise<Customer> {
    return this.api.request<Customer>('/api/v1/customers/me', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  changePassword(currentPassword: string, newPassword: string): Promise<MessageResponse> {
    return this.api.request<MessageResponse>('/api/v1/customers/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  closeMe(): Promise<MessageResponse> {
    return this.api.request<MessageResponse>('/api/v1/customers/me', { method: 'DELETE' });
  }

  listCustomers(page: number, size = 20): Promise<CustomerPage> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    return this.api.request<CustomerPage>(`/api/v1/admin/customers?${query.toString()}`);
  }

  getCustomer(id: string): Promise<Customer> {
    return this.api.request<Customer>(`/api/v1/admin/customers/${encodeURIComponent(id)}`);
  }

  updateStatus(id: string, active: boolean): Promise<Customer> {
    return this.api.request<Customer>(`/api/v1/admin/customers/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });
  }

  updateRole(id: string, role: CustomerRole): Promise<Customer> {
    return this.api.request<Customer>(`/api/v1/admin/customers/${encodeURIComponent(id)}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }
}
