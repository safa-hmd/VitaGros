import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role } from '../models/user.model';

const BASE = 'http://localhost:8081/api';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${BASE}/users`);
  }

  getById(id: number): Observable<User> {
    return this.http.get<User>(`${BASE}/users/${id}`);
  }

  create(user: User): Observable<User> {
    return this.http.post<User>(`${BASE}/users`, user);
  }

  update(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${BASE}/users/${id}`, user);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/users/${id}`);
  }

  // Enum Roles: ['ADMIN', 'USER']
  getAllRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${BASE}/roles`);
  }
}
