
import { Customer } from "@/types/customer";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  items: CartItem[];
  total: number;
  paymentType: 'cash' | 'mobile-money' | 'credit';
  customer?: Customer;
  timestamp: Date;
}

export type SalesStep = 'products' | 'payment' | 'customer' | 'confirm' | 'summary';
