
import { ProductSelection } from "./ProductSelection";
import { PaymentSelection } from "./PaymentSelection";
import { CustomerSelection } from "./CustomerSelection";
import { SaleConfirmation } from "./SaleConfirmation";
import { SaleSummary } from "./SaleSummary";
import { SalesStep, CartItem, Sale } from "@/types/sales";
import { Customer } from "@/types/customer";

interface SalesStepRendererProps {
  currentStep: SalesStep;
  cart: CartItem[];
  paymentType: 'cash' | 'mobile-money' | 'credit';
  selectedCustomer?: Customer;
  completedSale?: Sale;
  onAddToCart: (product: { id: string; name: string; price: number }) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  getTotalAmount: () => number;
  onProceedToPayment: () => void;
  onSelectPayment: (payment: 'cash' | 'mobile-money' | 'credit') => void;
  onSelectCustomer: (customer: Customer) => void;
  onConfirmSale: () => void;
  onNewSale: () => void;
  onBack: () => void;
  setCurrentStep: (step: SalesStep) => void;
}

export const SalesStepRenderer = ({
  currentStep,
  cart,
  paymentType,
  selectedCustomer,
  completedSale,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  getTotalAmount,
  onProceedToPayment,
  onSelectPayment,
  onSelectCustomer,
  onConfirmSale,
  onNewSale,
  setCurrentStep
}: SalesStepRendererProps) => {
  const handleBack = (fromStep: SalesStep) => {
    switch (fromStep) {
      case 'payment':
        setCurrentStep('products');
        break;
      case 'customer':
        setCurrentStep('payment');
        break;
      case 'confirm':
        if (paymentType === 'credit') {
          setCurrentStep('customer');
        } else {
          setCurrentStep('payment');
        }
        break;
      default:
        break;
    }
  };

  switch (currentStep) {
    case 'products':
      return (
        <ProductSelection
          cart={cart}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveFromCart={onRemoveFromCart}
          totalAmount={getTotalAmount()}
          onProceedToPayment={onProceedToPayment}
        />
      );
    case 'payment':
      return (
        <PaymentSelection
          totalAmount={getTotalAmount()}
          onSelectPayment={onSelectPayment}
          onBack={() => handleBack('payment')}
        />
      );
    case 'customer':
      return (
        <CustomerSelection
          onSelectCustomer={onSelectCustomer}
          onBack={() => handleBack('customer')}
        />
      );
    case 'confirm':
      return (
        <SaleConfirmation
          cart={cart}
          totalAmount={getTotalAmount()}
          paymentType={paymentType}
          customer={selectedCustomer}
          onConfirm={onConfirmSale}
          onBack={() => handleBack('confirm')}
        />
      );
    case 'summary':
      return (
        <SaleSummary
          sale={completedSale!}
          onNewSale={onNewSale}
        />
      );
    default:
      return null;
  }
};
