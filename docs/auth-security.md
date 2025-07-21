# Authentication & Security Documentation

## Authentication System

### Supabase Auth Integration
- JWT-based authentication with automatic token refresh
- Row Level Security (RLS) for multi-tenant data isolation
- Role-based access control (admin, manager, cashier)

### Key Components
- `AuthContext`: Global authentication state management
- `ProtectedRoute`: Route-level authentication guards
- `UserMenu`: User profile and logout functionality

## Security Features

### Row Level Security Policies
```sql
-- Users can only access their own data
CREATE POLICY "Users can view their own customers" 
ON public.customers FOR SELECT 
USING (auth.uid() = user_id);
```

### Role-Based Access
- **Admin**: Full system access, user management
- **Manager**: Business operations, reporting
- **Cashier**: Sales operations, limited access

### Data Protection
- All sensitive data encrypted at rest
- Secure password requirements
- Session management with automatic logout
- Audit trail for all data changes

## Authentication Flow
1. User login → Supabase Auth
2. JWT token issued and stored
3. RLS policies enforce data access
4. Automatic profile creation via database trigger
5. Role assignment and permission checking