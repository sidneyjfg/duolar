"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Gem,
  Home,
  LogOut,
  Menu,
  Settings,
  ShoppingCart,
  Sparkles,
  Target,
  WalletCards,
  type LucideIcon
} from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { useExperienceStore } from "@/store/experience-store";
import { IconButton } from "./ui";

type NavItem = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Operação diária",
    items: [
      { id: "dashboard", label: "Visão geral", hint: "Resumo da casa", icon: Home },
      { id: "day", label: "Hoje", hint: "Rotina em andamento", icon: CalendarDays },
      { id: "agenda", label: "Agenda", hint: "Compromissos e eventos", icon: CalendarClock },
      { id: "tasks", label: "Tarefas", hint: "Pendências combinadas", icon: CheckSquare }
    ]
  },
  {
    title: "Casa e compras",
    items: [
      { id: "shopping", label: "Lista", hint: "Itens para comprar", icon: ShoppingCart },
      { id: "market", label: "Mercado", hint: "Compra assistida", icon: Sparkles },
      { id: "mental", label: "Carga mental", hint: "Distribuição de cuidado", icon: BarChart3 }
    ]
  },
  {
    title: "Dinheiro e evolução",
    items: [
      { id: "finance", label: "Finanças", hint: "Gastos e acordos", icon: WalletCards },
      { id: "plan", label: "Plano", hint: "Benefícios da assinatura", icon: Gem },
      { id: "growth", label: "Hábitos", hint: "Desenvolvimento da casa", icon: Target }
    ]
  },
  {
    title: "Conta",
    items: [{ id: "settings", label: "Ajustes", hint: "Preferências e conexão", icon: Settings }]
  }
];

const nav = navGroups.flatMap((group) => group.items);
const mobileNav = nav.filter((item) => ["dashboard", "day", "tasks", "agenda", "market"].includes(item.id));

export function AppShell({ section, setSection, children }: { section: string; setSection: (section: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const reduceMotion = useReducedMotion();
  const animationsEnabled = useExperienceStore((state) => state.animationsEnabled);
  const canAnimate = animationsEnabled && !reduceMotion;
  const current = nav.find((item) => item.id === section) ?? nav[0];
  const selectSection = (id: string) => {
    setSection(id);
    setOpen(false);
  };
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      logout();
    }
  };

  return (
    <main className="min-h-screen bg-oat pb-[calc(5.75rem+env(safe-area-inset-bottom))] text-ink lg:pb-0">
      <motion.aside
        initial={canAnimate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className={`fixed inset-y-0 left-0 z-30 w-80 border-r border-line bg-[#fffaf0]/95 p-4 backdrop-blur-xl transition-transform duration-200 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-center gap-3 px-2">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-clay text-white shadow-sm">
              <Home size={21} />
            </div>
            <div>
              <p className="font-semibold">DuoLar</p>
              <p className="text-xs text-stone-500">Casa compartilhada</p>
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-4 bg-gradient-to-b from-[#fffaf0] to-transparent" />
            <nav className="duo-scrollbar h-full space-y-5 overflow-y-auto scroll-smooth px-0.5 pb-4 pr-1 pt-2">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">{group.title}</p>
                  {group.items.map((item) => (
                    <NavButton key={item.id} item={item} active={section === item.id} onSelect={selectSection} />
                  ))}
                </div>
              ))}
            </nav>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[#fffaf0] to-transparent" />
          </div>
          <div className="mt-auto rounded-lg border border-line bg-[#f4ead8] p-4">
            <p className="text-sm font-medium">{user?.name ?? "Conta demo"}</p>
            <p className="truncate text-xs text-stone-500">{user?.email}</p>
            <button onClick={handleLogout} className="mt-4 flex items-center gap-2 text-sm text-stone-500 transition hover:text-rose-700">
              <LogOut size={16} /> Sair
            </button>
          </div>
        </div>
      </motion.aside>
      {open && <button aria-label="Fechar navegação" className="fixed inset-0 z-20 bg-ink/20 backdrop-blur-[2px] lg:hidden" onClick={() => setOpen(false)} />}
      <div className="lg:pl-80">
        <motion.header
          initial={canAnimate ? { opacity: 0, y: -6 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-line bg-oat/86 px-3 py-2 backdrop-blur-xl md:px-8"
        >
          <div className="flex items-center gap-3">
            <IconButton icon={Menu} label="Abrir navegação" onClick={() => setOpen(true)} className="lg:hidden" />
            <div className="min-w-0">
              <p className="truncate text-xs text-stone-500 sm:text-sm">{current.hint}</p>
              <h1 className="truncate text-base font-semibold sm:text-lg">{current.label}</h1>
            </div>
          </div>
          <div className="hidden rounded-full border border-line bg-[#fffaf0] px-3 py-1.5 text-sm text-stone-600 md:block">Em teste · sem backup</div>
        </motion.header>
        <motion.div
          initial={canAnimate ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          className="p-3 sm:p-4 md:p-8"
        >
          {children}
        </motion.div>
      </div>
      {section !== "market" && (
        <motion.nav
          initial={canAnimate ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-5 gap-1 rounded-lg border border-line bg-[#fffaf0]/96 p-1 shadow-premium backdrop-blur-xl sm:inset-x-3 sm:bottom-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
        >
          {mobileNav.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => selectSection(item.id)}
                className={`flex h-[3.35rem] min-w-0 flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.98] sm:h-14 sm:text-[11px] ${active ? "bg-ink text-white" : "text-stone-500 hover:bg-[#efe2cf] hover:text-ink"}`}
              >
                <item.icon size={17} strokeWidth={2.2} />
                <span className="max-w-full truncate">{item.label}</span>
              </button>
            );
          })}
        </motion.nav>
      )}
    </main>
  );
}

function NavButton({ item, active, onSelect }: { item: NavItem; active: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={() => onSelect(item.id)}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-[background-color,color,transform,box-shadow] duration-150 ease-out active:scale-[0.99] ${active ? "bg-ink text-white shadow-sm" : "text-stone-600 hover:bg-[#efe2cf] hover:text-ink"}`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md transition-colors duration-150 ease-out ${active ? "bg-white/12 text-white" : "bg-[#f4ead8] text-clay group-hover:bg-[#ead8be]"}`}>
        <item.icon size={18} strokeWidth={2.15} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{item.label}</span>
        <span className={`block truncate text-xs leading-4 ${active ? "text-white/72" : "text-stone-500"}`}>{item.hint}</span>
      </span>
    </button>
  );
}
