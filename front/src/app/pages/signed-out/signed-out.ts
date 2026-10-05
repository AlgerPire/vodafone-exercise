import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signed-out',
  imports: [RouterLink],
  templateUrl: './signed-out.html',
})
export class SignedOutPage {
  private readonly route = inject(ActivatedRoute);
  readonly closed = signal(this.route.snapshot.queryParamMap.get('closed') === '1');
}
