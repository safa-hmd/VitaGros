export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Invoice {
  id: number;
  orderId: number;
  userId: number | null;
  amount: number;
  issueDate: string;
  status: 'UNPAID' | 'PAID' | 'CANCELLED';
}

export interface Payment {
  id: number;
  method: string;
  amount: number;
  paidAt: string;
  status: PaymentStatus;
  transactionRef: string;
  invoice: Invoice;
}