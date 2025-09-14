import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'cashier' | 'manager';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, profile, loading } = useAuth();
  const [profileTimeout, setProfileTimeout] = useState(false);

  console.log('ProtectedRoute - user:', user?.id, 'profile:', profile?.id, 'loading:', loading);

  // Set a timeout for profile loading
  useEffect(() => {
    if (user && !profile && !loading) {
      const timer = setTimeout(() => {
        console.log('Profile loading timeout reached');
        setProfileTimeout(true);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    } else {
      setProfileTimeout(false);
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace />;
  }

  if (!profile) {
    if (profileTimeout) {
      console.log('ProtectedRoute - Profile timeout, redirecting to auth');
      return <Navigate to="/auth" replace />;
    }
    
    console.log('ProtectedRoute - User exists but no profile, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
          <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (requiredRole && profile.role !== requiredRole && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  console.log('ProtectedRoute - Access granted');
  return <>{children}</>;
};