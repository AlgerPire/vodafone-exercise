import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerApi } from '../../core/customer-api';
import { ApiError } from '../../core/errors';
import { Customer, CustomerRole } from '../../core/models';

@Component({
  selector: 'app-customer-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './customer-detail.html',
})
export class CustomerDetailPage {
  private readonly api = inject(CustomerApi);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly customer = signal<Customer | null>(null);
  readonly roleDraft = signal<CustomerRole>('CUSTOMER');
  readonly loading = signal(true);
  readonly savingStatus = signal(false);
  readonly savingRole = signal(false);
  readonly banner = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  onRoleChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value === 'CUSTOMER' || value === 'ADMIN') {
      this.roleDraft.set(value);
    }
  }

  async toggleStatus(): Promise<void> {
    const current = this.customer();
    if (!current || this.savingStatus()) {
      return;
    }
    this.savingStatus.set(true);
    this.banner.set(null);
    this.notice.set(null);
    try {
      const updated = await this.api.updateStatus(current.id, !current.active);
      this.customer.set(updated);
      this.notice.set(updated.active ? 'Account reactivated.' : 'Account deactivated. Sign-in is now blocked.');
    } catch (error) {
      this.banner.set(error instanceof ApiError ? error.problem.detail || error.message : 'The request failed.');
    } finally {
      this.savingStatus.set(false);
    }
  }

  async saveRole(): Promise<void> {
    const current = this.customer();
    if (!current || this.savingRole()) {
      return;
    }
    this.savingRole.set(true);
    this.banner.set(null);
    this.notice.set(null);
    try {
      const updated = await this.api.updateRole(current.id, this.roleDraft());
      this.customer.set(updated);
      this.roleDraft.set(updated.role);
      this.notice.set('Role updated.');
    } catch (error) {
      this.banner.set(error instanceof ApiError ? error.problem.detail || error.message : 'The request failed.');
    } finally {
      this.savingRole.set(false);
    }
  }

  private async load(): Promise<void> {
    if (!this.id) {
      this.banner.set('Missing customer id.');
      this.loading.set(false);
      return;
    }
    try {
      const customer = await this.api.getCustomer(this.id);
      this.customer.set(customer);
      this.roleDraft.set(customer.role);
    } catch (error) {
      this.banner.set(error instanceof ApiError ? error.problem.detail || error.message : 'The request failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
