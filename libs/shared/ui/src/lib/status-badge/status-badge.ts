import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tag } from 'primeng/tag';

export type BadgeSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

@Component({
  selector: 'ui-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tag],
  template: `<p-tag [value]="label()" [severity]="severity()" />`,
})
export class StatusBadgeComponent {
  label = input.required<string>();
  severity = input<BadgeSeverity>('info');
}
