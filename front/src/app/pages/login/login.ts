import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { PasswordField } from '../../shared/password-field';

@Component({
  selector: 'app-login',
  imports: [RouterLink, PasswordField],
  templateUrl: './login.html',
})
export class LoginPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  readonly reason = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    this.reason.set(reason);
    if (reason !== 'session-ended' && this.auth.signedIn()) {
      void this.router.navigateByUrl(this.auth.homeUrl());
      return;
    }
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.reason.set(params.get('reason'));
    });
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    this.error.set(null);
    this.submitting.set(true);
    try {
      await this.auth.signInWithPassword(String(data.get('email') ?? ''), String(data.get('password') ?? ''));
    } catch (error) {
      this.submitting.set(false);
      this.error.set(error instanceof Error ? error.message : 'Sign-in failed.');
    }
  }
}
