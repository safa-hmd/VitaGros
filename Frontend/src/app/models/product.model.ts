export interface Category {
  id?: number;
  name: string;
  description: string;
}

export interface Product {
  id?: number;
  name: string;
  price: number;
  stock: number;
  category?: Category;
}
