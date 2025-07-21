# Frontend Architecture Documentation

## Overview

The frontend is built using React 18 with TypeScript, following a component-based architecture with clear separation of concerns. The application uses a custom design system built on Tailwind CSS and implements offline-first patterns throughout.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── sync/            # Sync-related components
│   ├── customers/       # Customer management components
│   ├── products/        # Product management components
│   ├── sales/           # Sales workflow components
│   └── sales-history/   # Sales reporting components
├── contexts/            # React contexts for global state
├── hooks/               # Custom React hooks
├── pages/               # Page-level components
├── services/            # Business logic and API services
├── types/               # TypeScript type definitions
├── lib/                 # Utility functions
└── integrations/        # Third-party integrations
```

## Component Architecture

### Component Hierarchy

```
App
├── AuthPage (Login/Register)
└── Authenticated Layout
    ├── DashboardHeader
    │   ├── UserMenu
    │   └── SyncStatusWidget
    ├── NavigationTabs
    └── Page Content
        ├── Index (Dashboard)
        │   ├── QuickSalesEntry
        │   ├── InventorySnapshot
        │   └── DailyReportSummary
        ├── SalesEntry
        │   └── SalesStepRenderer
        ├── ProductsManager
        │   ├── ProductsManagerHeader
        │   ├── ProductStatsCards
        │   └── ProductList
        ├── CustomersManager
        │   ├── CustomerListHeader
        │   └── CustomerList
        ├── SalesHistory
        │   ├── SalesHistoryHeader
        │   ├── SalesHistorySummaryCards
        │   └── SalesListWithPagination
        ├── ReportsPage
        └── SettingsPage
```

## Key Architectural Patterns

### 1. Compound Components

Many complex components use the compound component pattern for better composition:

```typescript
// Example: Sales workflow
<SalesStepRenderer currentStep={currentStep}>
  <ProductSelection />
  <CustomerSelection />
  <PaymentSelection />
  <SaleConfirmation />
</SalesStepRenderer>
```

### 2. Custom Hooks for State Management

Business logic is encapsulated in custom hooks:

```typescript
// Customer data management
const useCustomerData = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load from localStorage on mount
  useEffect(() => {
    loadCustomersFromStorage();
  }, []);
  
  return { customers, loading, addCustomer, updateCustomer, deleteCustomer };
};
```

### 3. Context for Global State

Global application state is managed through React contexts:

```typescript
// Authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Settings context for user preferences
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
```

## Design System

### Tailwind Configuration

The application uses a custom design system built on Tailwind CSS with semantic color tokens:

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... more semantic tokens
      }
    }
  }
}
```

### CSS Variables (index.css)

All colors are defined as HSL CSS variables for consistent theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variants */
}
```

### Component Variants

UI components use class-variance-authority (CVA) for consistent styling variants:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## Component Categories

### 1. UI Components (`components/ui/`)

Base UI components from shadcn/ui, customized for the application:

- **Form Components**: Input, Select, Textarea, Checkbox, Radio
- **Feedback Components**: Toast, Alert, Progress, Skeleton
- **Layout Components**: Card, Separator, Sheet, Dialog
- **Navigation Components**: Tabs, Breadcrumb, Pagination
- **Data Display**: Table, Badge, Avatar, Calendar

### 2. Feature Components

#### Sales Components (`components/sales/`)

Multi-step sales workflow with state management:

```typescript
const SalesStepRenderer = ({ currentStep, children }) => {
  const steps = [
    { id: 'products', title: 'Select Products', component: ProductSelection },
    { id: 'customer', title: 'Customer Info', component: CustomerSelection },
    { id: 'payment', title: 'Payment', component: PaymentSelection },
    { id: 'confirmation', title: 'Confirm Sale', component: SaleConfirmation }
  ];
  
  return (
    <div className="sales-workflow">
      <StepIndicator steps={steps} currentStep={currentStep} />
      <StepContent>{children}</StepContent>
    </div>
  );
};
```

#### Product Management (`components/products/`)

Product catalog management with inventory tracking:

- **ProductCard**: Individual product display with actions
- **ProductList**: Paginated product grid with search/filter
- **AddProductForm**: Product creation with validation
- **EditProductForm**: Product editing with stock management
- **BatchProductEntry**: Bulk product import functionality

#### Customer Management (`components/customers/`)

Customer relationship management:

- **CustomerList**: Customer directory with search
- **CustomerDetail**: Individual customer profile with credit history
- **AddCustomerForm**: Customer registration
- **PaymentForm**: Credit transaction processing

### 3. Sync Components (`components/sync/`)

Real-time sync status and controls:

- **SyncStatusWidget**: Main sync status display
- **SyncStatusDisplay**: Detailed status information
- **SyncActionButtons**: Manual sync controls
- **SyncStatusBadge**: Compact status indicator

## State Management Patterns

### 1. Local Component State

For component-specific state that doesn't need to be shared:

```typescript
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<string[]>([]);
```

### 2. Custom Hooks for Business Logic

Encapsulate complex state logic in custom hooks:

```typescript
const useSalesState = () => {
  const [currentStep, setCurrentStep] = useState('products');
  const [selectedProducts, setSelectedProducts] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const resetSale = useCallback(() => {
    setCurrentStep('products');
    setSelectedProducts([]);
    setSelectedCustomer(null);
  }, []);
  
  return {
    currentStep,
    selectedProducts,
    selectedCustomer,
    setCurrentStep,
    setSelectedProducts,
    setSelectedCustomer,
    resetSale
  };
};
```

### 3. Context for Global State

Application-wide state using React Context:

```typescript
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
} | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## Data Flow Patterns

### 1. Offline-First Data Flow

All data operations follow an offline-first pattern:

```
User Action → Update localStorage → Update UI → Queue for Sync → Sync to Server
```

### 2. Optimistic Updates

UI updates immediately while sync happens in background:

```typescript
const addProduct = async (product: Product) => {
  // Optimistic update
  const newProduct = { ...product, id: generateId(), synced: false };
  setProducts(prev => [...prev, newProduct]);
  
  // Persist to localStorage
  const products = JSON.parse(localStorage.getItem('products') || '[]');
  products.push(newProduct);
  localStorage.setItem('products', JSON.stringify(products));
  
  // Trigger sync (non-blocking)
  syncService.syncAll().catch(console.error);
};
```

### 3. Error Boundary Pattern

Graceful error handling with error boundaries:

```typescript
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    
    return this.props.children;
  }
}
```

## Form Handling

### React Hook Form Integration

All forms use React Hook Form with Zod validation:

```typescript
const addProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sellingPrice: z.number().min(0.01, 'Price must be greater than 0'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  category: z.string().optional(),
});

const AddProductForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(addProductSchema)
  });
  
  const onSubmit = (data: AddProductFormData) => {
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} error={errors.name?.message} />
      <Input {...register('sellingPrice', { valueAsNumber: true })} />
      {/* ... */}
    </form>
  );
};
```

## Performance Optimization

### 1. Code Splitting

Pages are lazy-loaded for better performance:

```typescript
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
```

### 2. Memoization

Expensive computations are memoized:

```typescript
const expensiveCalculation = useMemo(() => {
  return salesData.reduce((total, sale) => total + sale.totalAmount, 0);
}, [salesData]);

const MemoizedProductCard = memo(ProductCard);
```

### 3. Virtual Scrolling

Large lists use virtual scrolling for performance:

```typescript
const VirtualizedProductList = () => {
  const rowRenderer = ({ index, key, style }) => (
    <div key={key} style={style}>
      <ProductCard product={products[index]} />
    </div>
  );
  
  return (
    <AutoSizer>
      {({ height, width }) => (
        <List
          height={height}
          width={width}
          rowCount={products.length}
          rowHeight={100}
          rowRenderer={rowRenderer}
        />
      )}
    </AutoSizer>
  );
};
```

## Accessibility

### ARIA Support

Components include proper ARIA attributes:

```typescript
<button
  aria-label="Add product to cart"
  aria-pressed={isSelected}
  aria-describedby="product-description"
>
  Add to Cart
</button>
```

### Keyboard Navigation

Full keyboard navigation support:

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      handleSelect();
      break;
    case 'Escape':
      handleCancel();
      break;
  }
};
```

## Testing Strategies

### Component Testing

Components are tested with React Testing Library:

```typescript
describe('ProductCard', () => {
  it('displays product information correctly', () => {
    const product = createMockProduct();
    render(<ProductCard product={product} />);
    
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(`$${product.sellingPrice}`)).toBeInTheDocument();
  });
});
```

### Hook Testing

Custom hooks are tested with renderHook:

```typescript
describe('useCustomerData', () => {
  it('loads customers from localStorage on mount', () => {
    const mockCustomers = [createMockCustomer()];
    localStorage.setItem('customers', JSON.stringify(mockCustomers));
    
    const { result } = renderHook(() => useCustomerData());
    
    expect(result.current.customers).toEqual(mockCustomers);
  });
});
```

## Best Practices

1. **Component Composition**: Favor composition over inheritance
2. **Single Responsibility**: Each component has one clear purpose
3. **TypeScript**: Full type safety throughout the application
4. **Consistent Naming**: Use clear, descriptive component and prop names
5. **Error Handling**: Implement proper error boundaries and fallbacks
6. **Accessibility**: Ensure all components are accessible
7. **Performance**: Use React DevTools to identify performance bottlenecks
8. **Testing**: Maintain good test coverage for critical components