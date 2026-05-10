import { ChangeDetectionStrategy, Component, input, output, TemplateRef } from '@angular/core';
import { TableModule, TablePageEvent } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { NgTemplateOutlet } from '@angular/common';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
}

export interface PageEvent {
  page: number;
  rows: number;
}

export interface SortEvent {
  field: string;
  order: 1 | -1;
}

@Component({
  selector: 'ui-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TableModule, SkeletonModule, NgTemplateOutlet],
  template: `
    <p-table
      [value]="loading() ? skeletonRows : data()"
      [columns]="columns()"
      [totalRecords]="totalRecords()"
      [rows]="rows()"
      [paginator]="paginator()"
      [lazy]="lazy()"
      sortMode="single"
      (onPage)="onPage($event)"
      (onSort)="onSortChange($event)"
      styleClass="p-datatable-striped"
    >
      <ng-template #header>
        <tr>
          @for (col of columns(); track col.field) {
            <th [style.width]="col.width" [pSortableColumn]="col.sortable ? col.field : ''">
              {{ col.header }}
              @if (col.sortable) { <p-sortIcon [field]="col.field" /> }
            </th>
          }
          @if (rowActions()) { <th style="width: 5rem"></th> }
        </tr>
      </ng-template>

      <ng-template #body let-row let-columns="columns">
        <tr class="cursor-pointer" (click)="rowClick.emit(row)">
          @for (col of columns; track col.field) {
            <td>
              @if (loading()) { <p-skeleton /> } @else { {{ row[col.field] }} }
            </td>
          }
          @if (rowActions() && !loading()) {
            <td>
              <ng-container
                [ngTemplateOutlet]="rowActions()!"
                [ngTemplateOutletContext]="{ $implicit: row }"
              />
            </td>
          }
        </tr>
      </ng-template>

      <ng-template #emptymessage>
        @if (!loading()) {
          <tr>
            <td [attr.colspan]="columns().length + (rowActions() ? 1 : 0)" class="text-center p-4">
              Tidak ada data
            </td>
          </tr>
        }
      </ng-template>
    </p-table>
  `,
})
export class DataTableComponent {
  columns      = input.required<TableColumn[]>();
  data         = input<unknown[]>([]);
  loading      = input<boolean>(false);
  totalRecords = input<number>(0);
  rows         = input<number>(10);
  paginator    = input<boolean>(true);
  lazy         = input<boolean>(true);
  rowActions   = input<TemplateRef<unknown> | null>(null);

  rowClick   = output<unknown>();
  pageChange = output<PageEvent>();
  sortChange = output<SortEvent>();

  protected skeletonRows = Array(5).fill({});

  protected onPage(e: TablePageEvent) {
    this.pageChange.emit({ page: e.first / e.rows, rows: e.rows });
  }

  protected onSortChange(e: { field: string; order: number }) {
    if (e.field) {
      this.sortChange.emit({ field: e.field, order: e.order as 1 | -1 });
    }
  }
}
