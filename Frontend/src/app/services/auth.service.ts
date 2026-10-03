import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { User, AuthRequest, RegisterRequest, Role } from '../models/user.model';

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly BASE = 'http://localhost:8081/api';

  private _currentUser = signal<User | null>(null);
  private _token = signal<string | null>(null);

  currentUser = computed(() => this._currentUser());
  isLoggedIn = computed(() => !!this._token());
  isAdmin = computed(() => {
    const u = this._currentUser();
    return u?.role === Role.ADMIN || (u?.role as any) === 'ADMIN';
  });
  isUser = computed(() => {
    const u = this._currentUser();
    return !u?.role || u?.role === Role.USER || (u?.role as any) === 'USER';
  });

  constructor(private http: HttpClient, private router: Router) {
    // Restore session from localStorage
    const stored = localStorage.getItem('auth');
    if (stored) {
      try {
        const data = JSON.parse(stored) as AuthResponse;
        this._token.set(data.token);
        this._currentUser.set(data.user);
      } catch {
        localStorage.removeItem('auth');
      }
    }
  }

  getToken(): string | null {
    return this._token();
  }

  /**
   * Login – vérifie les identifiants via GET /api/users
   * expectedRole permet de bloquer l'accès si mauvais rôle
   */
  login(credentials: AuthRequest, expectedRole?: Role): Observable<AuthResponse> {
    return this.http.get<User[]>(`${this.BASE}/users`).pipe(
      map((users: User[]) => {
        const user = users.find(
          (u: User) => u.email?.toLowerCase() === credentials.email?.toLowerCase() && u.password === credentials.password
        );
        if (!user) {
          throw new Error('Email ou mot de passe incorrect.');
        }

        const roleStr = (user.role || 'USER').toString().toUpperCase();
        const roleEnum = roleStr === 'ADMIN' ? Role.ADMIN : Role.USER;

        if (expectedRole && roleEnum !== expectedRole) {
          if (expectedRole === Role.ADMIN) {
            throw new Error('Accès réservé : ce compte ne possède pas les droits Administrateur.');
          }
        }

        const authRes: AuthResponse = {
          token: 'session-' + btoa(user.email + ':' + Date.now()),
          user: {
            ...user,
            role: roleEnum
          }
        };
        this._saveSession(authRes);
        return authRes;
      })
    );
  }

  /**
   * Register – crée l'utilisateur avec rôle (défaut USER)
   */
  register(payload: RegisterRequest): Observable<AuthResponse> {
    const userPayload: User = {
      firstname: payload.firstname,
      lastname: payload.lastname,
      email: payload.email,
      password: payload.password,
      role: payload.role || Role.USER
    };

    return this.http.post<User>(`${this.BASE}/users`, userPayload).pipe(
      map((user: User) => {
        const authRes: AuthResponse = {
          token: 'session-' + btoa(user.email + ':' + Date.now()),
          user: {
            ...user,
            role: user.role === Role.ADMIN ? Role.ADMIN : Role.USER
          }
        };
        this._saveSession(authRes);
        return authRes;
      })
    );
  }

  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
    const stored = localStorage.getItem('auth');
    if (stored) {
      const data = JSON.parse(stored);
      data.user = user;
      localStorage.setItem('auth', JSON.stringify(data));
    }
  }

  logout(): void {
    this._token.set(null);
    this._currentUser.set(null);
    localStorage.removeItem('auth');
    this.router.navigate(['/auth/login']);
  }

  private _saveSession(res: AuthResponse): void {
    this._token.set(res.token);
    this._currentUser.set(res.user);
    localStorage.setItem('auth', JSON.stringify(res));
  }
}
