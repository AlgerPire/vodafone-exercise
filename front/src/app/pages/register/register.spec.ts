import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { CustomerApi } from '../../core/customer-api';
import { ApiError } from '../../core/errors';
import { RegisterPage } from './register';

describe('RegisterPage', () => {
  it('shows validation field errors from the API', async () => {
    const api = {
      register: vi.fn().mockRejectedValue(
        new ApiError(400, {
          title: 'VALIDATION_ERROR',
          status: 400,
          detail: 'Request validation failed.',
          fieldErrors: {
            email: 'must be a well-formed email address',
            password: 'size must be between 12 and 128',
          },
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), { provide: CustomerApi, useValue: api }],
    }).compileComponents();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
    fixture.componentInstance.form.setValue({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'StrongPassword123!',
      photoUrl: 'https://example.com/photos/jane.jpg',
    });
    await fixture.componentInstance.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Request validation failed.');
    expect(text).toContain('must be a well-formed email address');
    expect(text).toContain('size must be between 12 and 128');
    expect(api.register).toHaveBeenCalledOnce();
  });
});
