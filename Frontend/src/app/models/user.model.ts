export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id?: number;
  firstname: string;
  lastname: string;
  email: string;
  /** Écriture seule : le backend ne renvoie jamais le mot de passe. */
  password?: string;
  role: Role;
}

export interface AuthRequest {
  email: string;
  password: string;
  /** Espace demandé : le backend refuse un USER qui tente l'espace ADMIN */
  portal: Role;
}

export interface RegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
