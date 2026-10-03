export interface CustomerOrder {
  id?: number;
  userId: number;
  orderDate: string;
  status: string;
}

export interface OrderLine {
  id?: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  customerOrder?: CustomerOrder;
}
