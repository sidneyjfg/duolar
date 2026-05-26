"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Home, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button, Input } from "./ui";

const schema = z.object({
  name: z.preprocess((value) => (value === "" ? undefined : value), z.string().min(2, "Informe pelo menos 2 caracteres").optional()),
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "Use pelo menos 8 caracteres")
});

type FormData = z.infer<typeof schema>;

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const setSession = useAuthStore((state) => state.setSession);
  const { register, handleSubmit, formState } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" }
  });

  async function submit(data: FormData) {
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload = mode === "login" ? { email: data.email, password: data.password } : data;
      const response = await api.post(endpoint, payload);
      setSession(response.data.user, response.data.token);
      toast.success("Sessão iniciada");
    } catch {
      toast.error(mode === "register" ? "Não foi possível criar a conta. Confira a API e tente novamente." : "Não foi possível entrar. Confira e-mail, senha e API.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.26),transparent_34%),linear-gradient(135deg,#080b12,#101522_48%,#070a10)] p-4 text-slate-50 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-line bg-white/[0.03] shadow-premium lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden p-10 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.16),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500 text-white">
                <Home size={22} />
              </div>
              <div>
                <p className="text-lg font-semibold">DuoLar</p>
                <p className="text-sm text-slate-400">Casa leve, rotina compartilhada.</p>
              </div>
            </div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-sm text-indigo-100">
                <ShieldCheck size={16} /> MVP premium para casais
              </div>
              <h1 className="text-5xl font-semibold leading-tight tracking-normal">Organização doméstica com clareza e parceria.</h1>
              <p className="mt-5 text-lg leading-8 text-slate-300">Tarefas, agenda, mercado e finanças em um sistema calmo, rápido e bonito.</p>
            </motion.div>
            <div className="grid grid-cols-3 gap-3 text-sm text-slate-300">
              {["Equilíbrio semanal", "Modo Mercado", "Insights inteligentes"].map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-white/5 p-4">{item}</div>
              ))}
            </div>
          </div>
        </section>
        <section className="flex items-center p-6 md:p-10">
          <form onSubmit={handleSubmit(submit)} className="mx-auto w-full max-w-md space-y-5">
            <div>
              <div className="mb-5 flex w-fit rounded-2xl bg-white/6 p-1">
                <button type="button" onClick={() => setMode("login")} className={`rounded-xl px-4 py-2 text-sm ${mode === "login" ? "bg-white/12 text-white" : "text-slate-400"}`}>Login</button>
                <button type="button" onClick={() => setMode("register")} className={`rounded-xl px-4 py-2 text-sm ${mode === "register" ? "bg-white/12 text-white" : "text-slate-400"}`}>Cadastro</button>
              </div>
              <h2 className="text-3xl font-semibold">{mode === "login" ? "Bem-vindo de volta" : "Criar DuoLar"}</h2>
              <p className="mt-2 text-sm text-slate-400">Use sua conta real para salvar rotina, agenda e desenvolvimento no backend.</p>
            </div>
            {mode === "register" && <Input placeholder="Nome" {...register("name")} />}
            <Input placeholder="E-mail" type="email" {...register("email")} />
            <Input placeholder="Senha segura" type="password" {...register("password")} />
            <p className="min-h-5 text-sm text-rose-300">
              {formState.errors.name?.message ?? formState.errors.email?.message ?? formState.errors.password?.message}
            </p>
            <Button className="w-full" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
