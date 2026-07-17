"use client";

import { motion, useReducedMotion } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { DuoLarApp } from "@/components/duolar-app";
import { useAuthStore } from "@/store/auth-store";
import { useExperienceStore } from "@/store/experience-store";

type UnlockMode = "login" | "register";

export default function Page() {
  const user = useAuthStore((state) => state.user);
  const [unlocking, setUnlocking] = useState<UnlockMode | null>(null);

  useEffect(() => {
    if (!user) {
      setUnlocking(null);
      return;
    }

    const transition = window.sessionStorage.getItem("duolar-unlock-transition") as UnlockMode | null;
    if (transition !== "login" && transition !== "register") return;

    window.sessionStorage.removeItem("duolar-unlock-transition");
    setUnlocking(transition);
    const timer = window.setTimeout(() => setUnlocking(null), transition === "register" ? 1420 : 1120);
    return () => window.clearTimeout(timer);
  }, [user]);

  if (!user) return <AuthScreen />;
  if (unlocking) return <UnlockTransition mode={unlocking} />;
  return <DuoLarApp />;
}

function UnlockTransition({ mode }: { mode: UnlockMode }) {
  const reduceMotion = useReducedMotion();
  const animationsEnabled = useExperienceStore((state) => state.animationsEnabled);
  const canAnimate = animationsEnabled && !reduceMotion;

  if (!canAnimate) {
    return (
      <main className="grid min-h-screen place-items-center bg-oat text-ink">
        <div className="rounded-lg border border-line bg-[#fffaf0] px-5 py-4 shadow-premium">
          {mode === "register" ? "Criando sua casa..." : "Abrindo sua casa..."}
        </div>
      </main>
    );
  }

  const isRegister = mode === "register";

  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-oat text-ink">
      <motion.div
        className="absolute inset-0 bg-[#fffaf0]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 18 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative grid h-[420px] w-[340px] place-items-center"
      >
        {isRegister && (
          <>
            <motion.div
              className="absolute left-1/2 top-12 h-80 w-52 -translate-x-1/2 rounded-t-[112px] border border-line bg-[#f5dec5]/45"
              initial={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }}
              animate={{ opacity: 1, clipPath: "inset(0% 0 0 0)" }}
              transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute left-1/2 top-5 h-20 w-64 -translate-x-1/2 rounded-t-[120px] border border-line bg-[#ead8be]"
              initial={{ opacity: 0, y: -18, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.16, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            />
          </>
        )}
        <motion.div
          className="absolute h-[420px] w-[340px]"
          initial={{ transform: "translate3d(0, 0, 0) scale(1)", filter: "blur(0px)" }}
          animate={{ transform: "translate3d(0, 8px, 0) scale(4.9)", filter: "blur(1.2px)" }}
          transition={{ delay: isRegister ? 0.72 : 0.48, duration: 0.54, ease: [0.77, 0, 0.175, 1] }}
        >
          <div className="absolute bottom-10 left-1/2 h-5 w-56 -translate-x-1/2 rounded-full bg-stone-300/40 blur-sm" />
          <div className="absolute left-1/2 top-12 h-80 w-52 -translate-x-1/2 overflow-hidden rounded-t-[112px] border border-line bg-[#f5dec5] shadow-premium">
            <div className="absolute inset-x-5 top-10 h-16 rounded-t-full bg-[#f4ead8]" />
            <motion.div
              className="absolute bottom-0 left-1/2 h-60 w-28 -translate-x-1/2 rounded-t-[70px] bg-[linear-gradient(90deg,rgba(255,250,240,0.06),rgba(255,235,178,0.95),rgba(255,250,240,0.1))]"
              initial={{ opacity: 0, scaleX: 0.1 }}
              animate={{ opacity: [0, 0.9, 0.45], scaleX: [0.1, 0.34, 1.25] }}
              transition={{ delay: isRegister ? 0.72 : 0.5, duration: 0.46, ease: [0.23, 1, 0.32, 1] }}
            />
            <motion.div
              className="absolute bottom-0 left-1/2 h-60 w-36 origin-left rounded-t-[78px] border border-[#6f4a35] bg-clay shadow-xl"
              style={{ transformStyle: "preserve-3d" }}
              initial={{ transform: "translateX(-50%) perspective(760px) rotateY(0deg)" }}
              animate={{ transform: "translateX(-50%) perspective(760px) rotateY(-84deg)" }}
              transition={{ delay: isRegister ? 0.64 : 0.42, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="absolute inset-y-4 left-3 w-px bg-white/12" />
              <div className="absolute inset-y-0 right-0 w-8 rounded-r-[78px] bg-black/10" />
              <div className="absolute right-5 top-32 h-3 w-3 rounded-full bg-[#f7d777]" />
            </motion.div>
            <motion.div
              initial={{ transform: "translate(-116px, 142px) rotate(-14deg)", opacity: 0 }}
              animate={{
                transform: [
                  "translate(-116px, 142px) rotate(-14deg)",
                  "translate(-42px, 142px) rotate(0deg)",
                  "translate(-42px, 142px) rotate(180deg)",
                  "translate(-42px, 142px) rotate(360deg)"
                ],
                opacity: 1
              }}
              transition={{ delay: isRegister ? 0.18 : 0, duration: 0.56, times: [0, 0.45, 0.72, 1], ease: [0.23, 1, 0.32, 1] }}
              className="absolute left-1/2 top-0 text-[#8a6238]"
            >
              <KeyRound size={38} />
            </motion.div>
          </div>
        </motion.div>
        <motion.div
          className="absolute inset-0 bg-[#fffaf0]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isRegister ? 1.18 : 0.92, duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        />
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,250,240,0)_0%,rgba(255,250,240,0)_34%,rgba(244,234,216,0.9)_72%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isRegister ? 0.76 : 0.52, duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
        />
      </motion.div>
    </main>
  );
}
