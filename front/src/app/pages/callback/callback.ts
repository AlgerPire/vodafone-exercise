import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-callback',
  imports: [RouterLink],
  templateUrl: './callback.html',
})
export class CallbackPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly error = signal<string | null>(null);

  constructor() {
    void this.finish();
  }

  private async finish(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const oauthError = params.get('error');
    if (oauthError) {
      this.error.set(params.get('error_description') || oauthError);
      return;
    }
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state) {
      this.error.set('The authorization server did not return a code.');
      return;
    }
    try {
      await this.auth.completeSignIn(code, state);
      await this.router.navigateByUrl(this.auth.homeUrl(), { replaceUrl: true });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Sign-in failed.');
    }
  }
}
