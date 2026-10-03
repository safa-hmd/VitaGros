export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export type RoleType = Role | 'ADMIN' | 'USER';

export interface User {
  id?: number;
  firstname: string;
  lastname: string;
  email: string;
  password?: string;
  role?: RoleType;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  role?: RoleType;
}

export interface AuthResponse {
  token: string;
  user: User;
}
