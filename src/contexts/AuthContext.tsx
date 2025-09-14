import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'cashier' | 'manager';
  business_name?: string | null;
  phone?: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: 'admin' | 'cashier' | 'manager') => boolean;
  isAdmin: () => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createProfileManually = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('Attempting to create profile manually for user:', userId);
      
      // Get user data from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Could not get user data:', userError);
        return null;
      }

      // Create profile manually
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || 'User',
          role: 'cashier'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile manually:', error);
        return null;
      }

      // Also create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'cashier'
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }

      console.log('Profile created manually successfully');
      return data as UserProfile;
    } catch (error) {
      console.error('Error in createProfileManually:', error);
      return null;
    }
  };

  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<UserProfile | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error(`Error fetching profile (attempt ${attempt}/${retries}):`, error);
          
          // If it's a "not found" error and we have retries left, wait and try again
          if (error.code === 'PGRST116' && attempt < retries) {
            console.log(`Profile not found, retrying in ${attempt * 500}ms...`);
            await new Promise(resolve => setTimeout(resolve, attempt * 500));
            continue;
          }
          
          // If profile still not found after all retries, try to create it manually
          if (error.code === 'PGRST116' && attempt === retries) {
            console.log('Profile not found after all retries, attempting to create manually...');
            return await createProfileManually(userId);
          }
          
          return null;
        }

        return data as UserProfile;
      } catch (error) {
        console.error(`Error fetching profile (attempt ${attempt}/${retries}):`, error);
        
        if (attempt < retries) {
          console.log(`Retrying in ${attempt * 500}ms...`);
          await new Promise(resolve => setTimeout(resolve, attempt * 500));
        }
      }
    }
    
    console.error('Failed to fetch profile after all retries');
    return null;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Emergency function to manually create profile - can be called from browser console
  const emergencyCreateProfile = async () => {
    if (!user) {
      console.error('No user found');
      return;
    }
    
    console.log('Emergency profile creation for user:', user.id);
    const profileData = await createProfileManually(user.id);
    if (profileData) {
      setProfile(profileData);
      console.log('Profile created successfully:', profileData);
    } else {
      console.error('Failed to create profile');
    }
  };

  // Make emergency function available globally for debugging
  if (typeof window !== 'undefined') {
    (window as any).emergencyCreateProfile = emergencyCreateProfile;
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // For signup events, wait a bit longer for the database trigger to complete
          const delay = (event as string) === 'SIGNED_UP' ? 1000 : 200;
          
          setTimeout(async () => {
            console.log('Fetching profile for user:', session.user.id);
            const profileData = await fetchProfile(session.user.id);
            console.log('Profile data received:', profileData);
            setProfile(profileData);
            setLoading(false);
          }, delay);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          console.log('Fetching initial profile for user:', session.user.id);
          const profileData = await fetchProfile(session.user.id);
          console.log('Initial profile data received:', profileData);
          setProfile(profileData);
          setLoading(false);
        }, 200);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('Starting signup process for:', email);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    
    if (data?.user && !error) {
      console.log('Signup successful, user created:', data.user.id);
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: 'admin' | 'cashier' | 'manager'): boolean => {
    return profile?.role === role;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin';
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};