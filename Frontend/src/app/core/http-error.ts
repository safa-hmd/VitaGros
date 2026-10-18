import { HttpErrorResponse } from '@angular/common/http';

/** Extrait un message lisible d'une erreur HTTP (ProblemDetail Spring ou message générique). */
export function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) {
      return 'Microservice injoignable : vérifiez qu’il est démarré.';
    }
    const body = e.error as { detail?: unknown; message?: unknown } | null;
    if (body && typeof body.detail === 'string' && body.detail) return body.detail;
    if (body && typeof body.message === 'string' && body.message) return body.message;
    if (e.status === 409) return 'Opération impossible : cet élément est encore utilisé.';
  }
  return fallback;
}
