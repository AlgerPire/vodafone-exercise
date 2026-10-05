import { Component, ElementRef, effect, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordField),
      multi: true,
    },
  ],
  styles: `
    :host {
      display: block;
    }
  `,
  template: `
    <div class="password-field">
      <input
        #inputEl
        [id]="inputId()"
        [name]="fieldName()"
        [type]="visible() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        [attr.minlength]="minLength()"
        [attr.maxlength]="maxLength()"
        [required]="required()"
        [disabled]="disabled()"
        (input)="onInput(inputEl.value)"
        (blur)="onTouched()"
      />
      <button
        class="password-toggle"
        type="button"
        [attr.aria-controls]="inputId()"
        [attr.aria-pressed]="visible()"
        [attr.aria-label]="visible() ? 'Hide password' : 'Show password'"
        [disabled]="disabled()"
        (click)="visible.update((value) => !value)"
      >
        @if (visible()) {
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
            <path d="M9.9 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-3.2 4.2" />
            <path d="M6.1 6.1C3.5 8 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.1-.8" />
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        }
      </button>
    </div>
  `,
})
export class PasswordField implements ControlValueAccessor {
  readonly inputId = input.required<string>();
  readonly fieldName = input('', { alias: 'name' });
  readonly autocomplete = input('current-password');
  readonly minLength = input<number | null>(null);
  readonly maxLength = input<number | null>(null);
  readonly required = input(false);
  readonly visible = signal(false);
  readonly disabled = signal(false);

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  private readonly written = signal<string | null>(null);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    effect(() => {
      const next = this.written();
      const element = this.inputEl()?.nativeElement;
      if (next !== null && element && element.value !== next) {
        element.value = next;
      }
    });
  }

  writeValue(value: string | null): void {
    this.written.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  onInput(value: string): void {
    this.onChange(value);
  }
}
