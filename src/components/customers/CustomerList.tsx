
import { Users, Phone, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CustomerWithCredit } from "@/types/customer";

interface CustomerListProps {
  customers: CustomerWithCredit[];
  onSelectCustomer: (customer: CustomerWithCredit) => void;
}

export const CustomerList = ({ customers, onSelectCustomer }: CustomerListProps) => {
  if (customers.length === 0) {
    return (
      <Card className="m-4">
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No customers found</h3>
          <p className="text-muted-foreground">
            Start by adding your first customer to track credit sales and payments
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {customers.map((customer) => (
        <Card
          key={customer.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectCustomer(customer)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{customer.name}</h3>
                  {!customer.synced && (
                    <Badge variant="outline" className="text-xs">
                      Not Synced
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground mb-2">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                
                {customer.location && (
                  <p className="text-sm text-muted-foreground">{customer.location}</p>
                )}
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span 
                    className={`font-bold ${
                      customer.totalCredit > 0 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}
                  >
                    ${Math.abs(customer.totalCredit).toFixed(2)}
                  </span>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {customer.totalCredit > 0 ? 'Outstanding' : 'Paid'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
