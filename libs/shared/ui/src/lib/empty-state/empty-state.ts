import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      <i [class]="'pi ' + icon() + ' empty-state__icon'"></i>
      <p class="empty-state__title">{{ title() }}</p>
      @if (message()) {
        <p class="empty-state__message">{{ message() }}</p>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: var(--p-text-muted-color);
    }
    .empty-state__icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state__title { font-weight: 600; margin: 0; }
    .empty-state__message { font-size: 0.875rem; margin: 0.5rem 0 0; }
  `],
})
export class EmptyStateComponent {
  icon = input<string>('pi-inbox');
  title = input<string>('Tidak ada data');
  message = input<string>();
}
