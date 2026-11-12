import { Carrier } from './carrier.model';

export interface Delivery {
  id?: number;
  orderId: number;
  address: string;
  status: DeliveryStatus;
  carrier: Carrier | null; // C'est un objet complet, pas juste un ID
}

// On utilise exactement les statuts que le backend renvoie
export type DeliveryStatus = 'PENDING' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée'
};
