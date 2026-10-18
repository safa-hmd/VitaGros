export type OrderStatus = 'EN_ATTENTE' | 'CONFIRMEE' | 'EN_LIVRAISON' | 'LIVREE' | 'ANNULEE';
export type PaymentMethod = 'CARD' | 'CASH' | 'TRANSFER';

export interface OrderItem {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: 'PAID' | 'PENDING';
  reference: string;
  paidAt: string | null;
}

export interface OrderInvoice {
  number: string;
  issueDate: string;
  amount: number;
}

/** Commande complète (panier validé + paiement + facture + livraison). */
export interface Order {
  id: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  items: OrderItem[];
  total: number;
  address: string;
  phone: string;
  status: OrderStatus;
  payment: OrderPayment;
  invoice: OrderInvoice;
  carrierId: number | null;
  carrierName: string | null;
  carrierPhone: string | null;
}

/** Étapes de la livraison, dans l'ordre */
export const ORDER_STEPS: OrderStatus[] = ['EN_ATTENTE', 'CONFIRMEE', 'EN_LIVRAISON', 'LIVREE'];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  EN_ATTENTE: 'En attente de confirmation',
  CONFIRMEE: 'Confirmée',
  EN_LIVRAISON: 'En livraison',
  LIVREE: 'Livrée',
  ANNULEE: 'Annulée'
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: 'Carte bancaire',
  CASH: 'Paiement à la livraison',
  TRANSFER: 'Virement'
};
