"use client";

import { BarChart3, CalendarClock, CalendarDays, CheckSquare, Home, LogOut, Menu, Settings, ShoppingCart, Sparkles, Target, WalletCards } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { IconButton } from "./ui";

const nav = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "day", label: "Dia", icon: CalendarDays },
  { id: "agenda", label: "Agenda", icon: CalendarClock },
  { id: "tasks", label: "Tarefas", icon: CheckSquare },
  { id: "shopping", label: "Compras", icon: ShoppingCart },
  { id: "market", label: "Modo Mercado", icon: Sparkles },
  { id: "finance", label: "Finanças", icon: WalletCards },
  { id: "growth", label: "Desenvolvimento", icon: Target },
  { id: "mental", label: "Distribuição", icon: BarChart3 },
  { id: "settings", label: "Configurações", icon: Settings }
];

export function AppShell({ section, setSection, children }: { section: string; setSection: (section: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.12),transparent_28%),#080b12] text-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-line bg-ink/92 p-4 backdrop-blur-xl transition lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500">
              <Home size={21} />
            </div>
            <div>
              <p className="font-semibold">DuoLar</p>
              <p className="text-xs text-slate-500">Rotina compartilhada</p>
            </div>
          </div>
          <nav className="space-y-1">
            {nav.map((item) => (
              <button key={item.id} onClick={() => { setSection(item.id); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm transition ${section === item.id ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-white/6 hover:text-white"}`}>
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl border border-line bg-white/5 p-4">
            <p className="text-sm font-medium">{user?.name ?? "Conta demo"}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
            <button onClick={logout} className="mt-4 flex items-center gap-2 text-sm text-slate-400 transition hover:text-rose-300">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-ink/74 px-4 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3">
            <IconButton icon={Menu} label="Abrir navegação" onClick={() => setOpen(true)} className="lg:hidden" />
            <div>
              <p className="text-sm text-slate-500">Hoje</p>
              <h1 className="text-lg font-semibold">Casa sob controle</h1>
            </div>
          </div>
          <div className="hidden rounded-full border border-line bg-white/5 px-3 py-1.5 text-sm text-slate-300 md:block">Equilíbrio saudável</div>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </main>
  );
}
