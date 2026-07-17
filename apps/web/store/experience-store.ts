"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ExperienceState = {
  animationsEnabled: boolean;
  soundEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
};

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set) => ({
      animationsEnabled: true,
      soundEnabled: true,
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled })
    }),
    { name: "duolar-experience" }
  )
);
