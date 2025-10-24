import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, DashboardSummary } from '../types/transactions';

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  dashboardSummary: DashboardSummary | null;
  setUser: (user: User | null) => void;
  setDashboardSummary: (summary: DashboardSummary | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      dashboardSummary: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setDashboardSummary: (dashboardSummary) => set({ dashboardSummary }),
      logout: () => set({ user: null, isAuthenticated: false, dashboardSummary: null }),
    }),
    {
      name: 'user-store',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
