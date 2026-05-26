"use client";

import { AuthScreen } from "@/components/auth-screen";
import { DuoLarApp } from "@/components/duolar-app";
import { useAuthStore } from "@/store/auth-store";

export default function Page() {
  const token = useAuthStore((state) => state.token);
  return token ? <DuoLarApp /> : <AuthScreen />;
}
