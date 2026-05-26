"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/domain";

type AuthState = {
  user?: User;
  token?: string;
  setSession: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setSession: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: undefined, token: undefined })
    }),
    { name: "duolar-session" }
  )
);
