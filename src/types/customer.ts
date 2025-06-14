
export interface Customer {
  id: string;
  name: string;
  phone: string;
  location?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  synced: boolean;
}

export interface CreditTransaction {
  id: string;
  customerId: string;
  type: 'sale' | 'payment';
  amount: number;
  notes?: string;
  date: Date;
  synced: boolean;
}

export interface CustomerWithCredit extends Customer {
  totalCredit: number;
  lastCreditDate?: Date;
  lastPaymentDate?: Date;
}
