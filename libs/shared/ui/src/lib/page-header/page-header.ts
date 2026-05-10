import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-header__title">{{ title() }}</h1>
      @if (subtitle()) {
        <p class="page-header__subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 1.5rem; }
    .page-header__title { font-size: 1.5rem; font-weight: 600; margin: 0; }
    .page-header__subtitle { color: var(--p-text-muted-color); margin: 0.25rem 0 0; }
  `],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
