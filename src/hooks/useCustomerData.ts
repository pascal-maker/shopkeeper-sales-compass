
import { useMemo } from "react";
import { Customer, CreditTransaction, CustomerWithCredit } from "@/types/customer";

export const useCustomerData = (
  customers: Customer[], 
  creditTransactions: CreditTransaction[], 
  getCustomerCredit: (customerId: string) => number
) => {
  const getCustomersWithCredit = useMemo((): CustomerWithCredit[] => {
    return customers.map(customer => {
      const customerTransactions = creditTransactions.filter(t => t.customerId === customer.id);
      const lastCreditSale = customerTransactions
        .filter(t => t.type === 'sale')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const lastPayment = customerTransactions
        .filter(t => t.type === 'payment')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

      return {
        ...customer,
        totalCredit: getCustomerCredit(customer.id),
        lastCreditDate: lastCreditSale ? new Date(lastCreditSale.date) : undefined,
        lastPaymentDate: lastPayment ? new Date(lastPayment.date) : undefined
      };
    });
  }, [customers, creditTransactions, getCustomerCredit]);

  const getFilteredCustomers = (searchTerm: string): CustomerWithCredit[] => {
    return getCustomersWithCredit.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm)
    );
  };

  return {
    getCustomersWithCredit,
    getFilteredCustomers
  };
};
