import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';
import { CustomerApi } from './core/customer-api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  readonly auth = inject(AuthService);
  private readonly api = inject(CustomerApi);
  readonly health = signal<'checking' | 'up' | 'down'>('checking');

  constructor() {
    void this.checkHealth();
  }

  healthLabel(): string {
    const state = this.health();
    if (state === 'up') {
      return 'UP';
    }
    if (state === 'down') {
      return 'unreachable';
    }
    return 'checking';
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    window.location.reload();
  }

  private async checkHealth(): Promise<void> {
    try {
      const body = await this.api.health();
      this.health.set(body.status === 'UP' ? 'up' : 'down');
    } catch {
      this.health.set('down');
    }
  }
}
