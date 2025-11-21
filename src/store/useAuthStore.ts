import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'marcomms' | 'hr';

interface AuthState {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  userRole: null,
  isLoading: true,
  
  initialize: async () => {
    // Set up auth state listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      set({ session, user: session?.user ?? null });
      
      if (session?.user) {
        // Fetch user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        
        set({ userRole: roleData?.role as UserRole ?? null, isLoading: false });
      } else {
        set({ userRole: null, isLoading: false });
      }
    });

    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });
    
    if (session?.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      set({ userRole: roleData?.role as UserRole ?? null, isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, userRole: null });
  },
}));
