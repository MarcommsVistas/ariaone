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
  isInitialized: boolean;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  setPreferredVersion: (version: PreferredVersion) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  userRole: null,
  preferredVersion: null,
  isLoading: true,
  isInitialized: false,
  
  initialize: async () => {
    // Prevent multiple initializations
    if (get().isInitialized) {
      return;
    }
    
    set({ isInitialized: true });

    try {
      // Set up auth state listener FIRST (synchronous callback)
      supabase.auth.onAuthStateChange((event, session) => {
        set({ session, user: session?.user ?? null });
        
        // Defer Supabase calls to avoid deadlock (per Supabase best practices)
        if (session?.user) {
          setTimeout(async () => {
            try {
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
            } catch (error) {
              console.error('Error fetching user role:', error);
              set({ userRole: null, preferredVersion: null, isLoading: false });
            }
          }, 0);
        } else {
          set({ userRole: null, preferredVersion: null, isLoading: false });
        }
      });

      // THEN check for existing session
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
    } catch (error) {
      console.error('Error initializing auth:', error);
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
