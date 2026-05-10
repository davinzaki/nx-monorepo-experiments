import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { LeadsStore, LeadsParams } from '@aras-pro/sfa/data-access';
import {
  PageHeaderComponent,
  DataTableComponent,
  EmptyStateComponent,
  TableColumn,
  PageEvent,
  SortEvent,
  BadgeSeverity,
} from '@aras-pro/shared/ui';
import { LeadStatus } from '@aras-pro/shared/domain';

const STATUS_SEVERITY: Record<LeadStatus, BadgeSeverity> = {
  [LeadStatus.New]: 'info',
  [LeadStatus.Contacted]: 'secondary',
  [LeadStatus.Qualified]: 'warn',
  [LeadStatus.Proposal]: 'warn',
  [LeadStatus.Won]: 'success',
  [LeadStatus.Lost]: 'danger',
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'Baru',
  [LeadStatus.Contacted]: 'Dihubungi',
  [LeadStatus.Qualified]: 'Qualified',
  [LeadStatus.Proposal]: 'Proposal',
  [LeadStatus.Won]: 'Menang',
  [LeadStatus.Lost]: 'Kalah',
};

@Component({
  selector: 'sfa-leads-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, DataTableComponent, EmptyStateComponent],
  templateUrl: './leads-page.html',
  styleUrl: './leads-page.scss',
})
export class LeadsPageComponent implements OnInit {
  store = inject(LeadsStore);

  columns: TableColumn[] = [
    { field: 'name', header: 'Nama', sortable: true },
    { field: 'email', header: 'Email' },
    { field: 'phone', header: 'Telepon' },
    { field: 'status', header: 'Status', width: '130px' },
    { field: 'assignedTo', header: 'Sales', sortable: true },
    { field: 'createdAt', header: 'Dibuat', sortable: true },
  ];

  params: LeadsParams = { page: 0, rows: 10 };

  ngOnInit() {
    this.store.loadAll(this.params);
  }

  onPageChange(e: PageEvent) {
    this.params = { ...this.params, page: e.page, rows: e.rows };
    this.store.loadAll(this.params);
  }

  onSortChange(e: SortEvent) {
    this.params = {
      ...this.params,
      page: 0,
      sortField: e.field,
      sortOrder: e.order,
    };
    this.store.loadAll(this.params);
  }

  statusLabel(status: LeadStatus) {
    return STATUS_LABEL[status];
  }
  statusSeverity(status: LeadStatus) {
    return STATUS_SEVERITY[status];
  }
}
