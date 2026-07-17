"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, CircleOff, Home, KeyRound, Loader2, LockKeyhole, ShieldCheck, UnlockKeyhole, Volume2, VolumeX, Wand2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { playEntrySound } from "@/lib/entry-sound";
import { useAuthStore } from "@/store/auth-store";
import { useExperienceStore } from "@/store/experience-store";
import { Button, IconButton, Input } from "./ui";

const schema = z.object({
  name: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(2, "Informe pelo menos 2 caracteres").optional()),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "Use pelo menos 8 caracteres"),
  inviteToken: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(20, "Informe o convite").optional())
});

type FormData = z.infer<typeof schema>;

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [failedTick, setFailedTick] = useState(0);
  const setSession = useAuthStore((state) => state.setSession);
  const { animationsEnabled, soundEnabled, setAnimationsEnabled, setSoundEnabled } = useExperienceStore();
  const { register, handleSubmit, formState, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", inviteToken: "" }
  });
  const nameField = register("name");
  const emailField = register("email");
  const passwordField = register("password");
  const inviteField = register("inviteToken");
  const emailValue = watch("email") ?? "";
  const passwordValue = watch("password") ?? "";
  const lockOpen = emailValue.includes("@") && passwordValue.length >= 8;

  async function submit(data: FormData) {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: data.email, password: data.password } : data;
      const response = await api.post(endpoint, payload);
      if (soundEnabled) playEntrySound("success");
      window.sessionStorage.setItem("duolar-unlock-transition", mode);
      setSession(response.data.user);
      toast.success("Sessão iniciada");
    } catch {
      setFailedTick((value) => value + 1);
      if (soundEnabled) playEntrySound("failure");
      toast.error(mode === "register" ? "Não foi possível criar a conta. Confira a API e tente novamente." : "Não foi possível entrar. Confira e-mail, senha e API.");
    }
  }

  return (
    <main className="min-h-screen bg-oat p-4 text-ink md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-lg border border-line bg-[#fffaf0] shadow-premium lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(197,141,104,0.18),transparent_32%),linear-gradient(180deg,rgba(255,250,240,0)_0%,rgba(244,234,216,0.68)_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-clay text-white">
                <Home size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold">DuoLar</p>
                <p className="text-sm text-stone-500">Rotina combinada antes do desgaste.</p>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }} className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#efe2cf] px-3 py-1 text-sm text-stone-700">
                <ShieldCheck size={16} /> Valor antes de configuração pesada
              </div>
              <h1 className="text-5xl font-semibold leading-tight tracking-normal">Pare de renegociar a casa toda semana.</h1>
              <p className="mt-5 max-w-lg text-lg leading-8 text-stone-600">Entre e veja primeiro o que está pendente, quem ficou responsável e qual acordo evita a próxima conversa repetida.</p>
            </motion.div>
            <RevenueProofPanel />
          </div>
        </section>
        <section className="relative flex items-center overflow-hidden p-6 md:p-10">
          <CredentialDoorBackdrop lockReady={lockOpen} unlocking={formState.isSubmitting} failedTick={failedTick} animationsEnabled={animationsEnabled} />
          <motion.form
            onSubmit={handleSubmit(submit)}
            animate={formState.isSubmitting && animationsEnabled ? { opacity: 0.72, y: 4, scale: 0.995 } : { opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="relative z-10 mx-auto w-full max-w-md space-y-5 rounded-lg border border-line bg-[#fffaf0]/88 p-5 shadow-premium backdrop-blur-md md:p-6"
          >
            <div className="absolute right-4 top-4 flex gap-2">
              <IconButton
                type="button"
                icon={soundEnabled ? Volume2 : VolumeX}
                label={soundEnabled ? "Desativar sons da interface" : "Ativar sons da interface"}
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="h-9 w-9 bg-[#efe2cf]/86"
              />
              <IconButton
                type="button"
                icon={animationsEnabled ? Wand2 : CircleOff}
                label={animationsEnabled ? "Desativar animações de entrada" : "Ativar animações de entrada"}
                onClick={() => setAnimationsEnabled(!animationsEnabled)}
                className="h-9 w-9 bg-[#efe2cf]/86"
              />
            </div>
            <div>
              <div className="mb-5 flex w-fit rounded-xl bg-[#efe2cf] p-1">
                <button type="button" onClick={() => setMode("login")} className={`rounded-lg px-4 py-2 text-sm transition-colors ${mode === "login" ? "bg-white text-ink shadow-sm" : "text-stone-500"}`}>Entrar</button>
                <button type="button" onClick={() => setMode("register")} className={`rounded-lg px-4 py-2 text-sm transition-colors ${mode === "register" ? "bg-white text-ink shadow-sm" : "text-stone-500"}`}>Criar casa</button>
              </div>
              <h2 className="text-3xl font-semibold">{mode === "login" ? "Voltar para a rotina combinada" : "Criar sua casa compartilhada"}</h2>
              <p className="mt-2 text-sm leading-6 text-stone-500">
                {mode === "login" ? "Entre para ver pendências, agenda e acordos salvos no backend." : "Crie a conta e cadastre a primeira tarefa sem configurar tudo antes."}
              </p>
            </div>
            {mode === "register" && (
              <>
                <Input
                  placeholder="Nome"
                  {...nameField}
                  onChange={nameField.onChange}
                />
                <Input
                  placeholder="Convite"
                  {...inviteField}
                  onChange={inviteField.onChange}
                />
              </>
            )}
            <Input
              placeholder="E-mail"
              type="email"
              {...emailField}
              onChange={emailField.onChange}
            />
            <Input
              placeholder="Senha segura"
              type="password"
              {...passwordField}
              onChange={passwordField.onChange}
            />
            <p className="min-h-5 text-sm text-rose-300">
              {formState.errors.name?.message ?? formState.errors.email?.message ?? formState.errors.password?.message ?? formState.errors.inviteToken?.message}
            </p>
            <Button className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {mode === "login" ? "Entrar e ver rotina" : "Criar casa em 30s"}
              {!formState.isSubmitting && <ArrowRight size={16} />}
            </Button>
            <p className="text-center text-xs text-stone-500">Sem cartão. A rotina fica salva no backend conectado.</p>
          </motion.form>
        </section>
      </div>
    </main>
  );
}

function RevenueProofPanel() {
  const points = [
    "Primeira tarefa guiada",
    "Agenda por responsável",
    "Carga mental visível"
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-line bg-[#f4ead8] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">Em vez de uma tela vazia</p>
        <p className="mt-2 text-2xl font-semibold">A primeira ação já aparece como próximo passo.</p>
        <p className="mt-3 text-sm leading-6 text-stone-600">O foco é reduzir tempo até valor: entrar, entender o que fazer agora e fechar um pequeno acordo da casa.</p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm text-stone-700">
        {points.map((item) => (
          <div key={item} className="rounded-lg border border-line bg-[#fffaf0]/82 p-4">
            <CheckCircle2 className="mb-3 text-moss" size={18} />
            {item}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-lg border border-clay/25 bg-[#fff7e8] px-4 py-3 text-sm">
        <span className="font-medium">Sem cartão na entrada</span>
        <span className="text-stone-500">compromisso baixo, valor rápido</span>
      </div>
    </div>
  );
}

function CredentialDoorBackdrop({
  lockReady,
  unlocking,
  failedTick,
  animationsEnabled
}: {
  lockReady: boolean;
  unlocking: boolean;
  failedTick: number;
  animationsEnabled: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const canAnimate = animationsEnabled && !reduceMotion;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(216,162,127,0.28),transparent_32%),linear-gradient(180deg,rgba(244,234,216,0.4)_0%,rgba(255,250,240,0.92)_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[31rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-t-[12rem] border border-[#7a513a]/55 bg-[#d8a27f]/64 shadow-premium" />
      <div className="absolute left-1/2 top-[calc(50%-7.4rem)] h-20 w-36 -translate-x-1/2 rounded-t-full bg-[#f7cda8]/45" />
      <motion.div
        key={`door-${failedTick}`}
        initial={false}
        animate={
          canAnimate && failedTick > 0
            ? {
                transform: [
                  "translate3d(-50%, -43%, 0)",
                  "translate3d(calc(-50% - 5px), -43%, 0)",
                  "translate3d(calc(-50% + 4px), -43%, 0)",
                  "translate3d(-50%, -43%, 0)"
                ]
              }
            : { transform: "translate3d(-50%, -43%, 0)" }
        }
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="absolute left-1/2 top-1/2 h-[25rem] w-[17rem] rounded-t-[9rem] border border-[#7a513a]/55 bg-clay/82 shadow-xl"
      >
        <div className="absolute inset-y-8 left-5 w-px bg-white/10" />
        <div className="absolute inset-y-0 right-0 w-12 rounded-r-[9rem] bg-black/10" />
      </motion.div>
      <div className="absolute left-1/2 top-[calc(50%+0.45rem)] h-4 w-4 translate-x-[5.2rem] rounded-full bg-[#f7d777]" />
      <motion.div
        initial={false}
        animate={
          !canAnimate
            ? { opacity: lockReady ? 0.46 : 0.68 }
            : {
                transform: lockReady ? "translate3d(-50%, -50%, 0) scale(0.96)" : "translate3d(-50%, -50%, 0) scale(1)",
                opacity: lockReady ? 0.5 : 0.78
              }
        }
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        className="absolute left-1/2 top-1/2 grid h-20 w-20 place-items-center rounded-full border border-line bg-[#fffaf0]/86 text-ink shadow-premium"
      >
        <motion.span
          key={lockReady ? "open" : "closed"}
          initial={!canAnimate ? false : { opacity: 0, transform: "translateY(4px) scale(0.96)" }}
          animate={{ opacity: 1, transform: "translateY(0) scale(1)" }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        >
          {lockReady ? <UnlockKeyhole size={34} /> : <LockKeyhole size={34} />}
        </motion.span>
      </motion.div>
      <motion.div
        key={`${failedTick}-${lockReady ? "ready" : "locked"}`}
        initial={!canAnimate ? false : { transform: "translate3d(-50%, -50%, 0) rotate(-16deg)", opacity: 0.72 }}
        animate={
          !canAnimate
            ? { opacity: lockReady ? 0.42 : 0.54 }
            : failedTick > 0
              ? {
                  transform: [
                    "translate3d(-50%, -50%, 0) rotate(-12deg)",
                    "translate3d(-50%, -50%, 0) rotate(18deg)",
                    "translate3d(-50%, -50%, 0) rotate(-10deg)"
                  ],
                  opacity: 0.62
                }
            : {
                transform: lockReady
                  ? ["translate3d(-50%, -50%, 0) rotate(-8deg)", "translate3d(-50%, -50%, 0) rotate(38deg)", "translate3d(-50%, -50%, 0) rotate(18deg)"]
                  : ["translate3d(-50%, -50%, 0) rotate(-16deg)", "translate3d(-50%, -50%, 0) rotate(14deg)", "translate3d(-50%, -50%, 0) rotate(-8deg)"],
                opacity: lockReady ? 0.48 : 0.58
              }
        }
        transition={{ duration: failedTick > 0 ? 0.24 : lockReady ? 0.32 : 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="absolute left-[calc(50%+5.5rem)] top-[calc(50%+0.4rem)] text-[#8a6238]"
      >
        <KeyRound size={34} />
      </motion.div>
      <div className="absolute inset-x-10 bottom-24 h-px bg-stone-300/75" />
      <div className="absolute bottom-[5.85rem] left-16 h-3 w-3 rounded-full bg-stone-300/65" />
      <div className="absolute bottom-[5.85rem] right-16 h-3 w-3 rounded-full bg-stone-300/65" />
      {unlocking && <div className="absolute inset-0 bg-[#fffaf0]/28" />}
    </div>
  );
}
