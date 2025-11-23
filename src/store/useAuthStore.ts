import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'marcomms' | 'hr';
export type PreferredVersion = 'v1' | 'v2' | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  preferredVersion: PreferredVersion;
  isLoading: boolean;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  setPreferredVersion: (version: PreferredVersion) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  userRole: null,
  preferredVersion: null,
  isLoading: true,
  
  initialize: async () => {
    // Set up auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });
      
      if (session?.user) {
        // Fetch user role and preferred version
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role, preferred_version')
          .eq('user_id', session.user.id)
          .single();
        
        set({ 
          userRole: roleData?.role as UserRole ?? null, 
          preferredVersion: roleData?.preferred_version as PreferredVersion ?? null,
          isLoading: false 
        });
      } else {
        set({ userRole: null, preferredVersion: null, isLoading: false });
      }
    });

    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });
    
    if (session?.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, preferred_version')
        .eq('user_id', session.user.id)
        .single();
      
      set({ 
        userRole: roleData?.role as UserRole ?? null, 
        preferredVersion: roleData?.preferred_version as PreferredVersion ?? null,
        isLoading: false 
      });
    } else {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userRole: null, preferredVersion: null });
  },

  setPreferredVersion: (version: PreferredVersion) => {
    set({ preferredVersion: version });
  },
}));
