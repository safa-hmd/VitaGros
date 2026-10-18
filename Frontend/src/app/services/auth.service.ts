import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, RegisterRequest, Role, User } from '../models/user.model';

const BASE = 'http://localhost:8081/api/auth';
const STORAGE_KEY = 'vitagros_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _session = signal<AuthResponse | null>(this.restore());

  readonly currentUser = computed<User | null>(() => this._session()?.user ?? null);
  readonly isLoggedIn = computed(() => this._session() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === Role.ADMIN);

  getToken(): string | null {
    return this._session()?.token ?? null;
  }

  /** Page d'accueil selon le rôle */
  homeUrl(): string {
    return this.isAdmin() ? '/admin' : '/shop';
  }

  login(req: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/login`, req).pipe(tap(res => this.save(res)));
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${BASE}/register`, req).pipe(tap(res => this.save(res)));
  }

  /** Met à jour l'utilisateur en session (après modification du profil) */
  updateCurrentUser(user: User): void {
    const s = this._session();
    if (s) this.save({ token: s.token, user });
  }

  logout(): void {
    const target = this.isAdmin() ? '/auth/admin-login' : '/auth/login';
    this._session.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate([target]);
  }

  private save(res: AuthResponse): void {
    this._session.set(res);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
  }

  private restore(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}
