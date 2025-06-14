import { useState } from "react";
import { ProductSelection } from "./sales/ProductSelection";
import { PaymentSelection } from "./sales/PaymentSelection";
import { CustomerSelection } from "./sales/CustomerSelection";
import { SaleConfirmation } from "./sales/SaleConfirmation";
import { SaleSummary } from "./sales/SaleSummary";
import { Customer } from "@/types/customer";
import { updateInventoryAfterSale } from "@/services/inventoryService";
import { useToast } from "@/hooks/use-toast";

export interface CartItem {
  id: number;
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

export const SalesEntry = () => {
  const [currentStep, setCurrentStep] = useState<SalesStep>('products');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentType, setPaymentType] = useState<'cash' | 'mobile-money' | 'credit'>('cash');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [completedSale, setCompletedSale] = useState<Sale | undefined>();
  const { toast } = useToast();

  const addToCart = (product: { id: number; name: string; price: number }) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handlePaymentSelection = (payment: 'cash' | 'mobile-money' | 'credit') => {
    setPaymentType(payment);
    if (payment === 'credit') {
      setCurrentStep('customer');
    } else {
      setCurrentStep('confirm');
    }
  };

  const handleCustomerSelection = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCurrentStep('confirm');
  };

  const handleConfirmSale = () => {
    console.log('Confirming sale, updating inventory...');
    
    // Update inventory before saving the sale
    const inventoryResult = updateInventoryAfterSale(cart);
    
    if (!inventoryResult.success) {
      // Show error toast and don't proceed with sale
      toast({
        title: "Inventory Error",
        description: inventoryResult.errors.join(', '),
        variant: "destructive"
      });
      console.error('Inventory update failed:', inventoryResult.errors);
      return;
    }

    // If inventory update successful, proceed with sale
    const sale: Sale = {
      items: cart,
      total: getTotalAmount(),
      paymentType,
      customer: selectedCustomer,
      timestamp: new Date()
    };
    
    // Save sale to local storage (simulating offline database)
    const existingSales = JSON.parse(localStorage.getItem('sales') || '[]');
    existingSales.push({ ...sale, id: Date.now(), synced: false });
    localStorage.setItem('sales', JSON.stringify(existingSales));
    
    // Dispatch custom event to notify other components of new sale
    window.dispatchEvent(new Event('storage'));
    
    console.log('Sale completed successfully. Inventory updated.');
    
    // Show success toast
    toast({
      title: "Sale Completed",
      description: `Sale of $${getTotalAmount()} completed successfully. Inventory updated.`,
    });
    
    setCompletedSale(sale);
    setCurrentStep('summary');
  };

  const handleNewSale = () => {
    setCart([]);
    setPaymentType('cash');
    setSelectedCustomer(undefined);
    setCompletedSale(undefined);
    setCurrentStep('products');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'products':
        return (
          <ProductSelection
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
            onRemoveFromCart={removeFromCart}
            totalAmount={getTotalAmount()}
            onProceedToPayment={() => setCurrentStep('payment')}
          />
        );
      case 'payment':
        return (
          <PaymentSelection
            totalAmount={getTotalAmount()}
            onSelectPayment={handlePaymentSelection}
            onBack={() => setCurrentStep('products')}
          />
        );
      case 'customer':
        return (
          <CustomerSelection
            onSelectCustomer={handleCustomerSelection}
            onBack={() => setCurrentStep('payment')}
          />
        );
      case 'confirm':
        return (
          <SaleConfirmation
            cart={cart}
            totalAmount={getTotalAmount()}
            paymentType={paymentType}
            customer={selectedCustomer}
            onConfirm={handleConfirmSale}
            onBack={() => {
              if (paymentType === 'credit') {
                setCurrentStep('customer');
              } else {
                setCurrentStep('payment');
              }
            }}
          />
        );
      case 'summary':
        return (
          <SaleSummary
            sale={completedSale!}
            onNewSale={handleNewSale}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentStep()}
    </div>
  );
};
