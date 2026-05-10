import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, JwtPayload, LoginDto } from './auth.models';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private router = inject(Router);

  private _user = signal<JwtPayload | null>(null);

  user = this._user.asReadonly();
  isAuthenticated = computed(() => this._user() !== null);
  tenantId = computed(() => this._user()?.tenantId ?? null);
  role = computed(() => this._user()?.role ?? null);

  constructor() {
    const payload = this.tokenService.decode();
    if (payload && !this.tokenService.isExpired()) {
      this._user.set(payload);
    }
  }

  login(dto: LoginDto): Observable<void> {
    return this.http.post<AuthResponse>('/api/auth/login', dto).pipe(
      tap(({ accessToken }) => {
        this.tokenService.set(accessToken);
        this._user.set(this.tokenService.decode());
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    this.tokenService.remove();
    this._user.set(null);
    this.router.navigate(['/login']);
  }
}
