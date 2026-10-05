import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerApi } from '../../core/customer-api';
import { PasswordField } from '../../shared/password-field';
import { ApiError } from '../../core/errors';
import {
  applyFieldErrors,
  controlMessage,
  httpUrlValidator,
  watchFieldEdits,
} from '../../core/field-errors';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, PasswordField],
  templateUrl: './register.html',
})
export class RegisterPage {
  private readonly api = inject(CustomerApi);
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    photoUrl: ['', [Validators.required, Validators.maxLength(2048), httpUrlValidator]],
  });
  readonly revision = signal(0);
  readonly submitting = signal(false);
  readonly success = signal<string | null>(null);
  readonly verificationUrl = signal<string | null>(null);
  readonly banner = signal<string | null>(null);

  constructor() {
    watchFieldEdits(this.form, () => this.revision.update((value) => value + 1), takeUntilDestroyed());
  }

  message(name: 'name' | 'email' | 'password' | 'photoUrl'): string | null {
    this.revision();
    return controlMessage(this.form.controls[name]);
  }

  async submit(): Promise<void> {
    this.banner.set(null);
    this.form.markAllAsTouched();
    this.revision.update((value) => value + 1);
    if (this.form.invalid || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const value = this.form.getRawValue();
    try {
      const result = await this.api.register({
        name: value.name.trim(),
        email: value.email.trim().toLowerCase(),
        password: value.password,
        photoUrl: value.photoUrl.trim(),
      });
      this.success.set(result.message);
      this.verificationUrl.set(result.verificationUrl ?? null);
    } catch (error) {
      this.banner.set(this.applyError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private applyError(error: unknown): string {
    if (!(error instanceof ApiError)) {
      return 'The request failed.';
    }
    const fieldErrors = { ...error.problem.fieldErrors };
    if (error.problem.title === 'EMAIL_ALREADY_REGISTERED' && !fieldErrors['email']) {
      fieldErrors['email'] = error.problem.detail || 'This email is already registered.';
    }
    applyFieldErrors(this.form, fieldErrors);
    this.revision.update((value) => value + 1);
    return error.problem.detail || error.message;
  }
}
