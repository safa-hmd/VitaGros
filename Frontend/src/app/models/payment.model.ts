export interface Invoice {
  id?: number;
  orderId: number;
  amount: number;
  issueDate: string;
}

export interface Payment {
  id?: number;
  method: string;
  amount: number;
  paidAt: string;
  invoice?: Invoice;
}
