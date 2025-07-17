
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/types';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any; data: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('unassigned');
  const [isLoading, setIsLoading] = useState(true);

  // Check for active session on mount
  useEffect(() => {
    async function getInitialSession() {
      setIsLoading(true);
      
      // Get session
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      setUser(activeSession?.user ?? null);
      
      if (activeSession?.user) {
        await determineUserRole(activeSession.user.id);
      }
      
      setIsLoading(false);

      // Listen for auth changes
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (_event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (newSession?.user) {
            await determineUserRole(newSession.user.id);
          } else {
            setUserRole('unassigned');
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }

    getInitialSession();
  }, []);

  // Determine the user's role based on their ID
  async function determineUserRole(userId: string) {
    try {
      // Check admin table
      const { data: adminData } = await supabase
        .from('admins')
        .select()
        .eq('id', userId)
        .single();
      
      if (adminData) {
        setUserRole('admin');
        return;
      }

      // Check developer table
      const { data: developerData } = await supabase
        .from('developers')
        .select()
        .eq('id', userId)
        .single();
      
      if (developerData) {
        setUserRole('developer');
        return;
      }

      // Default role
      setUserRole('unassigned');
    } catch (error) {
      console.error("Error determining user role:", error);
      setUserRole('unassigned');
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Add emailRedirectTo with the current URL to redirect after signup
    // Added autoConfirm: true option to skip email confirmation
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          email_confirmed: true // This adds a user metadata flag
        }
      }
    });
    
    // If signup is successful, immediately sign in the user
    if (data.user && !error) {
      await supabase.auth.signInWithPassword({ email, password });
    }
    
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserRole('unassigned');
  };

  const value = {
    session,
    user,
    userRole,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
