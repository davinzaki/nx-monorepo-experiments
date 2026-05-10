import { Injectable } from '@angular/core';
import { JwtPayload } from './auth.models';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly KEY = 'access_token';

  set(token: string): void {
    localStorage.setItem(this.KEY, token);
  }

  get(): string | null {
    return localStorage.getItem(this.KEY);
  }

  remove(): void {
    localStorage.removeItem(this.KEY);
  }

  decode(): JwtPayload | null {
    const token = this.get();
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    } catch {
      return null;
    }
  }

  isExpired(): boolean {
    const payload = this.decode();
    if (!payload) return true;
    return Date.now() >= payload.exp * 1000;
  }
}
