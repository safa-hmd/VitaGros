/** Email valide (contrôle simple côté client ; la vérité reste côté serveur). */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
