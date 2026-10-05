import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerApi } from '../../core/customer-api';
import { ApiError } from '../../core/errors';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
})
export class VerifyEmailPage {
  private readonly api = inject(CustomerApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly pending = signal(false);
  readonly confirmed = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const token = this.route.snapshot.queryParamMap.get('token')?.trim();
    if (!token) {
      return;
    }
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
    void this.confirm(token);
  }

  private async confirm(token: string): Promise<void> {
    this.pending.set(true);
    this.error.set(null);
    try {
      await this.api.verifyEmail(token);
      this.confirmed.set(true);
    } catch (error) {
      this.error.set(
        error instanceof ApiError
          ? error.problem.detail || 'This confirmation link is invalid or has expired.'
          : 'We could not confirm your email. Open the link again.',
      );
    } finally {
      this.pending.set(false);
    }
  }
}
