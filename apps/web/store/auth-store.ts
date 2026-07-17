"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/domain";

type AuthState = {
  user?: User;
  setSession: (user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setSession: (user) => set({ user }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: undefined })
    }),
    {
      name: "duolar-session",
      version: 2,
      partialize: (state) => ({ user: state.user }),
      migrate: (persisted) => {
        const state = persisted as Partial<AuthState>;
        return { user: state.user };
      }
    }
  )
);
