
import { useSalesState } from "@/hooks/useSalesState";
import { SalesStepRenderer } from "./sales/SalesStepRenderer";

export const SalesEntry = () => {
  const {
    currentStep,
    setCurrentStep,
    cart,
    paymentType,
    selectedCustomer,
    completedSale,
    addToCart,
    updateQuantity,
    removeFromCart,
    getTotalAmount,
    handlePaymentSelection,
    handleCustomerSelection,
    handleConfirmSale,
    handleNewSale
  } = useSalesState();

  return (
    <div className="min-h-screen bg-background">
      <SalesStepRenderer
        currentStep={currentStep}
        cart={cart}
        paymentType={paymentType}
        selectedCustomer={selectedCustomer}
        completedSale={completedSale}
        onAddToCart={addToCart}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        getTotalAmount={getTotalAmount}
        onProceedToPayment={() => setCurrentStep('payment')}
        onSelectPayment={handlePaymentSelection}
        onSelectCustomer={handleCustomerSelection}
        onConfirmSale={handleConfirmSale}
        onNewSale={handleNewSale}
        onBack={() => {}}
        setCurrentStep={setCurrentStep}
      />
    </div>
  );
};
