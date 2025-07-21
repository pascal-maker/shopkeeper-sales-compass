# API Integration Documentation

## Overview

The application integrates with Supabase for all backend operations including database access, authentication, and real-time features. The integration follows an offline-first pattern with local storage as the primary data source and Supabase as the sync target.

## Supabase Client Configuration

### Client Setup (`src/integrations/supabase/client.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxsszxmtbugbjsxhpwkt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

### TypeScript Types

Supabase provides auto-generated TypeScript types in `src/integrations/supabase/types.ts` (read-only file that reflects the current database schema).

## Data Access Patterns

### 1. Service Layer Architecture

All Supabase interactions are encapsulated in service files:

```
src/services/
├── customerService.ts      # Customer CRUD operations
├── inventoryService.ts     # Product and inventory management
├── salesService.ts         # Sales transaction handling
└── sync/                   # Sync-specific services
    ├── customerSync.ts
    ├── productSync.ts
    ├── salesSync.ts
    └── creditTransactionSync.ts
```

### 2. Customer Service (`src/services/customerService.ts`)

Handles all customer-related database operations:

```typescript
export const customerService = {
  // Create customer with automatic user association
  async createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customer.name,
        phone: customer.phone,
        location: customer.location,
        notes: customer.notes,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create customer: ${error.message}`);
    return transformCustomer(data);
  },

  // Get all customers for current user
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch customers: ${error.message}`);
    return data.map(transformCustomer);
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: updates.name,
        phone: updates.phone,
        location: updates.location,
        notes: updates.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update customer: ${error.message}`);
    return transformCustomer(data);
  },

  // Delete customer
  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete customer: ${error.message}`);
  }
};

// Transform database row to application model
const transformCustomer = (row: any): Customer => ({
  id: row.id,
  name: row.name,
  phone: row.phone,
  location: row.location || undefined,
  notes: row.notes || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  synced: row.sync_status === 'synced'
});
```

### 3. Inventory Service (`src/services/inventoryService.ts`)

Manages product catalog and inventory operations:

```typescript
export const inventoryService = {
  // Create product
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit_type: product.unitType || 'piece',
        cost_price: product.costPrice,
        selling_price: product.sellingPrice,
        quantity: product.quantity || 0,
        min_stock_level: product.minStockLevel || 10,
        expiry_date: product.expiryDate?.toISOString().split('T')[0],
        user_id: (await supabase.auth.getUser()).data.user?.id,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create product: ${error.message}`);
    return transformProduct(data);
  },

  // Get low stock products
  async getLowStockProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('low_stock_products')
      .select('*');

    if (error) throw new Error(`Failed to fetch low stock products: ${error.message}`);
    return data.map(transformProduct);
  },

  // Adjust inventory
  async adjustInventory(
    productId: string, 
    adjustmentQuantity: number, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('inventory_adjustments')
      .insert({
        product_id: productId,
        adjustment_quantity: adjustmentQuantity,
        reason,
        notes,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        sync_status: 'synced'
      });

    if (error) throw new Error(`Failed to adjust inventory: ${error.message}`);
  }
};
```

### 4. Sales Service (`src/services/salesService.ts`)

Handles complex sales transactions with referential integrity:

```typescript
export const salesService = {
  // Create complete sale with items
  async createSale(sale: CreateSaleRequest): Promise<Sale> {
    // Start transaction
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_id: sale.customerId,
        total_amount: sale.totalAmount,
        payment_type: sale.paymentType,
        notes: sale.notes,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        sync_status: 'synced'
      })
      .select()
      .single();

    if (saleError) throw new Error(`Failed to create sale: ${saleError.message}`);

    // Create sale items
    const saleItems = sale.items.map(item => ({
      sale_id: saleData.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      sync_status: 'synced' as const
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      // Rollback sale if items fail
      await supabase.from('sales').delete().eq('id', saleData.id);
      throw new Error(`Failed to create sale items: ${itemsError.message}`);
    }

    // Create credit transaction if needed
    if (sale.paymentType === 'credit' && sale.customerId) {
      await supabase
        .from('credit_transactions')
        .insert({
          customer_id: sale.customerId,
          sale_id: saleData.id,
          transaction_type: 'sale',
          amount: sale.totalAmount,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          sync_status: 'synced'
        });
    }

    return transformSale(saleData);
  },

  // Get sales with pagination
  async getSales(page: number = 1, limit: number = 20): Promise<{
    sales: Sale[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true });

    // Get paginated sales
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers (name, phone),
        sale_items (
          id,
          product_id,
          quantity,
          unit_price,
          total_price,
          products (name, sku)
        )
      `)
      .order('sale_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(`Failed to fetch sales: ${error.message}`);

    return {
      sales: data.map(transformSaleWithItems),
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    };
  }
};
```

## Authentication Integration

### Auth Context (`src/contexts/AuthContext.tsx`)

Manages authentication state and operations:

```typescript
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Load user profile
          await loadUserProfile(session.user.id);
        }
        
        if (event === 'SIGNED_OUT') {
          // Clear local data
          clearLocalStorage();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Sync Integration Patterns

### 1. Bidirectional Sync

Each sync service implements both push (local → server) and pull (server → local) operations:

```typescript
export const productSync = {
  // Push local changes to server
  async syncProducts(): Promise<SyncResult> {
    const products: Product[] = JSON.parse(localStorage.getItem('products') || '[]');
    const unsyncedProducts = products.filter(p => !p.synced);
    
    const errors: string[] = [];
    let synced = 0;

    for (const product of unsyncedProducts) {
      try {
        // Check for duplicates
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('name', product.name)
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (!existingProduct) {
          // Create new product
          const { error } = await supabase
            .from('products')
            .insert({
              name: product.name,
              sku: product.sku,
              category: product.category,
              unit_type: product.unitType,
              cost_price: product.costPrice,
              selling_price: product.sellingPrice,
              quantity: product.quantity,
              min_stock_level: product.minStockLevel,
              expiry_date: product.expiryDate?.toISOString().split('T')[0],
              user_id: (await supabase.auth.getUser()).data.user?.id,
              sync_status: 'synced'
            });

          if (error) {
            errors.push(`Failed to sync product ${product.name}: ${error.message}`);
            continue;
          }
        }

        // Mark as synced locally
        const updatedProducts = products.map(p => 
          p.id === product.id ? { ...p, synced: true } : p
        );
        localStorage.setItem('products', JSON.stringify(updatedProducts));
        synced++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to sync product ${product.name}: ${errorMsg}`);
      }
    }

    return { success: errors.length === 0, errors, synced };
  },

  // Pull server changes to local
  async pullProducts(): Promise<{ products: Product[], errors: string[] }> {
    try {
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*');

      if (error) {
        return { products: [], errors: [`Failed to pull products: ${error.message}`] };
      }

      if (productsData) {
        const localProducts = productsData.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || undefined,
          category: p.category || undefined,
          unitType: p.unit_type as 'piece' | 'kg' | 'liter' | 'meter',
          costPrice: p.cost_price ? Number(p.cost_price) : undefined,
          sellingPrice: Number(p.selling_price),
          quantity: p.quantity || 0,
          minStockLevel: p.min_stock_level || 10,
          expiryDate: p.expiry_date ? new Date(p.expiry_date) : undefined,
          createdAt: new Date(p.created_at),
          updatedAt: new Date(p.updated_at),
          synced: true
        }));

        return { products: localProducts, errors: [] };
      }

      return { products: [], errors: [] };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return { products: [], errors: [errorMsg] };
    }
  }
};
```

### 2. Conflict Resolution

When conflicts occur during sync, the system applies resolution strategies:

```typescript
const resolveConflicts = (localData: any[], serverData: any[]) => {
  const resolved = [];
  const conflicts = [];

  for (const localItem of localData) {
    const serverItem = serverData.find(s => s.id === localItem.id);
    
    if (serverItem) {
      // Check timestamps for conflict detection
      const localTime = new Date(localItem.updatedAt).getTime();
      const serverTime = new Date(serverItem.updated_at).getTime();
      
      if (serverTime > localTime) {
        // Server is newer - use server data
        resolved.push(transformFromServer(serverItem));
      } else if (localTime > serverTime) {
        // Local is newer - keep local data and sync to server
        conflicts.push({
          type: 'local_newer',
          local: localItem,
          server: serverItem
        });
      } else {
        // Same timestamp - no conflict
        resolved.push(localItem);
      }
    } else {
      // Local item doesn't exist on server - sync it
      conflicts.push({
        type: 'local_only',
        local: localItem
      });
    }
  }

  return { resolved, conflicts };
};
```

## Error Handling Patterns

### 1. Network Error Handling

```typescript
const handleSupabaseError = (error: any, operation: string) => {
  if (error.code === 'PGRST301') {
    // Row Level Security violation
    throw new Error('Access denied. Please check your permissions.');
  }
  
  if (error.message?.includes('fetch')) {
    // Network error
    throw new Error('Network error. Please check your connection and try again.');
  }
  
  if (error.code === '23505') {
    // Unique constraint violation
    throw new Error('This record already exists.');
  }
  
  // Generic error
  throw new Error(`${operation} failed: ${error.message}`);
};
```

### 2. Retry Logic

```typescript
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff
      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};
```

## Real-time Features

### 1. Subscription Setup

```typescript
const setupRealtimeSubscription = () => {
  const channel = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'products'
      },
      (payload) => {
        console.log('New product created:', payload);
        // Update local state
        handleNewProduct(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'products'
      },
      (payload) => {
        console.log('Product updated:', payload);
        // Update local state
        handleProductUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

## Performance Optimization

### 1. Query Optimization

```typescript
// Efficient pagination with count
const getPaginatedSales = async (page: number, limit: number) => {
  const offset = (page - 1) * limit;
  
  // Single query with joins
  const { data, error, count } = await supabase
    .from('sales')
    .select(`
      id,
      total_amount,
      payment_type,
      sale_date,
      customers!inner(name, phone),
      sale_items(
        quantity,
        unit_price,
        products!inner(name)
      )
    `, { count: 'exact' })
    .order('sale_date', { ascending: false })
    .range(offset, offset + limit - 1);
    
  return { data, count, error };
};
```

### 2. Batch Operations

```typescript
// Batch insert for better performance
const batchCreateProducts = async (products: Product[]) => {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < products.length; i += batchSize) {
    batches.push(products.slice(i, i + batchSize));
  }
  
  const results = await Promise.allSettled(
    batches.map(batch => 
      supabase.from('products').insert(batch.map(transformForInsert))
    )
  );
  
  return results;
};
```

## Security Considerations

### 1. Row Level Security Compliance

All queries automatically enforce RLS policies:

```typescript
// This query automatically filters by user_id due to RLS
const getUserProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*');
  // Only returns products belonging to authenticated user
  
  return { data, error };
};
```

### 2. Input Validation

```typescript
const validateAndCreateCustomer = async (customerData: any) => {
  // Validate input
  const schema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number'),
    location: z.string().optional(),
    notes: z.string().optional()
  });
  
  const validatedData = schema.parse(customerData);
  
  // Create customer with validated data
  return await customerService.createCustomer(validatedData);
};
```

## Testing Strategies

### 1. API Mocking

```typescript
// Mock Supabase client for testing
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
    }
  }
}));
```

### 2. Integration Testing

```typescript
describe('Customer Service Integration', () => {
  beforeEach(async () => {
    // Setup test user
    await setupTestUser();
  });
  
  afterEach(async () => {
    // Cleanup test data
    await cleanupTestData();
  });
  
  it('should create and retrieve customer', async () => {
    const customerData = {
      name: 'Test Customer',
      phone: '+1234567890'
    };
    
    const createdCustomer = await customerService.createCustomer(customerData);
    expect(createdCustomer.id).toBeDefined();
    
    const customers = await customerService.getCustomers();
    expect(customers).toContainEqual(
      expect.objectContaining({
        name: customerData.name,
        phone: customerData.phone
      })
    );
  });
});
```

## Best Practices

1. **Use TypeScript**: Leverage Supabase's generated types
2. **Error Handling**: Always handle and transform Supabase errors
3. **RLS Compliance**: Design queries with RLS in mind
4. **Batch Operations**: Use batch operations for multiple records
5. **Connection Management**: Use single client instance
6. **Real-time Subscriptions**: Properly manage subscription lifecycle
7. **Security**: Validate all inputs and use parameterized queries
8. **Performance**: Optimize queries and use appropriate indexes
9. **Testing**: Mock Supabase client for unit tests
10. **Monitoring**: Log all API interactions for debugging
