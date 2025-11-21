import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'marcomms' | 'hr';

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userName: string | null;
  login: (role: UserRole, name: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userRole: null,
      userName: null,
      login: (role, name) => {
        set({
          isAuthenticated: true,
          userRole: role,
          userName: name,
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          userRole: null,
          userName: null,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
