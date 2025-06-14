
import { useState, useEffect } from "react";
import { ArrowLeft, Plus, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Customer } from "@/types/customer";
import { customerService } from "@/services/customerService";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CustomerSelectionProps {
  onSelectCustomer: (customer: Customer) => void;
  onBack: () => void;
}

export const CustomerSelection = ({
  onSelectCustomer,
  onBack
}: CustomerSelectionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerLocation, setNewCustomerLocation] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for customers
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
  });

  // Mutation for adding customer
  const addCustomerMutation = useMutation({
    mutationFn: customerService.addCustomer,
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Customer Added",
        description: `${newCustomer.name} has been added successfully.`,
      });
      onSelectCustomer(newCustomer);
      setIsAddingCustomer(false);
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerLocation("");
    },
    onError: (error) => {
      console.error('Error adding customer:', error);
      toast({
        title: "Error",
        description: "Failed to add customer. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const handleAddCustomer = () => {
    if (newCustomerName.trim() && newCustomerPhone.trim()) {
      addCustomerMutation.mutate({
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        location: newCustomerLocation.trim() || undefined,
        notes: undefined
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Select Customer</h1>
            <p className="text-muted-foreground">Required for credit sales</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Select Customer</h1>
            <p className="text-muted-foreground">Required for credit sales</p>
          </div>
        </div>
        <div className="text-center py-8 text-red-600">
          <p>Error loading customers. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Select Customer</h1>
          <p className="text-muted-foreground">Required for credit sales</p>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-12 text-lg"
        />

        <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogTrigger asChild>
            <Button className="w-full h-12" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <Input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <Input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location (Optional)</label>
                <Input
                  value={newCustomerLocation}
                  onChange={(e) => setNewCustomerLocation(e.target.value)}
                  placeholder="Enter location"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddingCustomer(false)} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCustomer} 
                  className="flex-1"
                  disabled={addCustomerMutation.isPending}
                >
                  {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onSelectCustomer(customer)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.location && (
                    <p className="text-sm text-muted-foreground mt-1">{customer.location}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCustomers.length === 0 && searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No customers found matching "{searchTerm}"</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => setIsAddingCustomer(true)}
          >
            Add New Customer
          </Button>
        </div>
      )}

      {customers.length === 0 && !searchTerm && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="mb-2">No customers yet</p>
          <p className="text-sm mb-4">Add your first customer to start making credit sales</p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddingCustomer(true)}
          >
            Add First Customer
          </Button>
        </div>
      )}
    </div>
  );
};
