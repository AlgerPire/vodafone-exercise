import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerApi } from '../../core/customer-api';
import { ApiError } from '../../core/errors';
import { CustomerPage } from '../../core/models';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, DatePipe],
  templateUrl: './customer-list.html',
})
export class CustomerListPage {
  private readonly api = inject(CustomerApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly page = signal<CustomerPage | null>(null);
  readonly loading = signal(true);
  readonly banner = signal<string | null>(null);
  readonly pageSize = 20;

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const requested = Number(params.get('page') ?? '0');
      const page = Number.isInteger(requested) && requested >= 0 ? requested : 0;
      void this.load(page);
    });
  }

  async changePage(page: number): Promise<void> {
    await this.router.navigate([], { queryParams: { page }, queryParamsHandling: 'merge' });
  }

  private async load(page: number): Promise<void> {
    this.loading.set(true);
    this.banner.set(null);
    try {
      this.page.set(await this.api.listCustomers(page, this.pageSize));
    } catch (error) {
      this.page.set(null);
      this.banner.set(error instanceof ApiError ? error.problem.detail || error.message : 'The request failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
