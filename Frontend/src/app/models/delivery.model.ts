export interface Carrier {
  id?: number;
  name: string;
  phone: string;
}

export interface Delivery {
  id?: number;
  orderId: number;
  address: string;
  status: string;
  carrier?: Carrier;
}
