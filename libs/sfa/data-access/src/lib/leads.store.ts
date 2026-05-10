import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { Lead, CreateLeadDto, UpdateLeadDto } from '@aras-pro/shared/domain';

export interface LeadsParams {
  page: number;
  rows: number;
  sortField?: string;
  sortOrder?: 1 | -1;
}

@Injectable({ providedIn: 'root' })
export class LeadsStore {
  private http = inject(HttpClient);

  private _leads = signal<Lead[]>([]);
  private _selected = signal<Lead | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _total = signal(0);

  // selectors
  leads = this._leads.asReadonly();
  selected = this._selected.asReadonly();
  loading = this._loading.asReadonly();
  error = this._error.asReadonly();
  total = this._total.asReadonly();
  isEmpty = computed(() => !this._loading() && this._leads().length === 0);

  loadAll(params: LeadsParams = { page: 0, rows: 10 }) {
    this._loading.set(true);
    this._error.set(null);

    const { page, rows, sortField, sortOrder } = params;
    const queryParams: Record<string, string> = {
      page: String(page),
      size: String(rows),
      ...(sortField && { sort: `${sortField},${sortOrder === -1 ? 'desc' : 'asc'}` }),
    };

    this.http
      .get<{ content: Lead[]; totalElements: number }>('/leads', { params: queryParams })
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: ({ content, totalElements }) => {
          this._leads.set(content);
          this._total.set(totalElements);
        },
        error: (err) => this._error.set(err.message),
      });
  }

  create(dto: CreateLeadDto) {
    this._loading.set(true);
    this.http
      .post<Lead>('/leads', dto)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (lead) => this._leads.update((list) => [lead, ...list]),
        error: (err) => this._error.set(err.message),
      });
  }

  update(id: string, dto: UpdateLeadDto) {
    this._loading.set(true);
    this.http
      .put<Lead>(`/leads/${id}`, dto)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (updated) =>
          this._leads.update((list) =>
            list.map((l) => (l.id === id ? updated : l))
          ),
        error: (err) => this._error.set(err.message),
      });
  }

  remove(id: string) {
    this._loading.set(true);
    this.http
      .delete(`/leads/${id}`)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: () => this._leads.update((list) => list.filter((l) => l.id !== id)),
        error: (err) => this._error.set(err.message),
      });
  }

  select(lead: Lead | null) {
    this._selected.set(lead);
  }
}
