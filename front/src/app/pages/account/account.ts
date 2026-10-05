import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CustomerApi } from '../../core/customer-api';
import { ApiError } from '../../core/errors';
import { controlMessage, watchFieldEdits } from '../../core/field-errors';
import { Customer } from '../../core/models';
import { PasswordField } from '../../shared/password-field';

@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule, PasswordField],
  templateUrl: './account.html',
})
export class AccountPage {
  private readonly api = inject(CustomerApi);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly forms = inject(FormBuilder).nonNullable;
  readonly nameForm = this.forms.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
  });
  readonly passwordForm = this.forms.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    confirmPassword: ['', Validators.required],
  });
  readonly revision = signal(0);
  readonly customer = signal<Customer | null>(null);
  readonly loading = signal(true);
  readonly savingName = signal(false);
  readonly savingPassword = signal(false);
  readonly closing = signal(false);
  readonly confirmClose = signal(false);
  readonly banner = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  constructor() {
    watchFieldEdits(this.nameForm, () => this.revision.update((value) => value + 1), takeUntilDestroyed());
    watchFieldEdits(this.passwordForm, () => this.revision.update((value) => value + 1), takeUntilDestroyed());
    void this.load();
  }

  nameError(): string | null {
    this.revision();
    return controlMessage(this.nameForm.controls.name);
  }

  passwordError(name: 'currentPassword' | 'newPassword' | 'confirmPassword'): string | null {
    this.revision();
    return controlMessage(this.passwordForm.controls[name]);
  }

  async saveName(): Promise<void> {
    const person = this.customer();
    this.notice.set(null);
    this.banner.set(null);
    this.nameForm.markAllAsTouched();
    this.revision.update((value) => value + 1);
    if (!person || this.nameForm.invalid || this.savingName()) {
      return;
    }
    this.savingName.set(true);
    try {
      const updated = await this.api.updateMe({
        name: this.nameForm.controls.name.value.trim(),
        email: person.email,
        photoUrl: person.photoUrl,
      });
      this.customer.set(updated);
      this.notice.set('Name updated.');
    } catch (error) {
      this.banner.set(this.detail(error));
    } finally {
      this.savingName.set(false);
    }
  }

  async savePassword(): Promise<void> {
    this.notice.set(null);
    this.banner.set(null);
    this.passwordForm.markAllAsTouched();
    this.revision.update((value) => value + 1);
    if (this.passwordForm.invalid || this.savingPassword()) {
      return;
    }
    const value = this.passwordForm.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.banner.set('The new passwords do not match.');
      return;
    }
    this.savingPassword.set(true);
    try {
      const result = await this.api.changePassword(value.currentPassword, value.newPassword);
      this.passwordForm.reset();
      this.notice.set(result.message);
    } catch (error) {
      this.banner.set(this.detail(error));
    } finally {
      this.savingPassword.set(false);
    }
  }

  async closeAccount(): Promise<void> {
    this.closing.set(true);
    this.banner.set(null);
    try {
      await this.api.closeMe();
      await this.auth.signOut();
      await this.router.navigate(['/signed-out'], { queryParams: { closed: '1' } });
    } catch (error) {
      this.banner.set(this.detail(error));
      this.closing.set(false);
    }
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    window.location.reload();
  }

  private async load(): Promise<void> {
    try {
      const customer = await this.api.me();
      this.customer.set(customer);
      this.nameForm.controls.name.setValue(customer.name, { emitEvent: false });
    } catch (error) {
      this.banner.set(this.detail(error));
    } finally {
      this.loading.set(false);
    }
  }

  private detail(error: unknown): string {
    return error instanceof ApiError ? error.problem.detail || error.message : 'The request failed.';
  }
}
