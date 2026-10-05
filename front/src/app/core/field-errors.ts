import { AbstractControl, FormGroup, ValidationErrors } from '@angular/forms';
import { MonoTypeOperatorFunction } from 'rxjs';

export function httpUrlValidator(control: AbstractControl): ValidationErrors | null {
  const value = typeof control.value === 'string' ? control.value.trim() : '';
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { url: true };
    }
    return null;
  } catch {
    return { url: true };
  }
}

export function controlMessage(control: AbstractControl): string | null {
  const errors = control.errors;
  if (!errors || !(control.touched || control.dirty)) {
    return null;
  }
  if (typeof errors['server'] === 'string') {
    return errors['server'];
  }
  if (errors['required']) {
    return 'This field is required.';
  }
  if (errors['email']) {
    return 'Enter a valid email address.';
  }
  if (errors['minlength']) {
    const error = errors['minlength'] as { requiredLength: number };
    return `Use at least ${error.requiredLength} characters.`;
  }
  if (errors['maxlength']) {
    const error = errors['maxlength'] as { requiredLength: number };
    return `Use at most ${error.requiredLength} characters.`;
  }
  if (errors['url']) {
    return 'Enter an http or https URL.';
  }
  return null;
}

export function applyFieldErrors(form: FormGroup, fieldErrors: Record<string, string> | undefined): void {
  if (!fieldErrors) {
    return;
  }
  for (const [name, message] of Object.entries(fieldErrors)) {
    const control = form.get(name);
    if (!control) {
      continue;
    }
    control.setErrors({ ...control.errors, server: message });
    control.markAsTouched();
  }
}

export function clearServerError(form: FormGroup, name: string): void {
  const control = form.get(name);
  if (!control?.errors?.['server']) {
    return;
  }
  const { server: _server, ...rest } = control.errors;
  control.setErrors(Object.keys(rest).length ? rest : null);
}

export function watchFieldEdits(
  form: FormGroup,
  onEdit: () => void,
  stop: MonoTypeOperatorFunction<unknown>,
): void {
  for (const name of Object.keys(form.controls)) {
    form
      .get(name)
      ?.valueChanges.pipe(stop)
      .subscribe(() => {
        clearServerError(form, name);
        onEdit();
      });
  }
}
