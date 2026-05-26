import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("glass rounded-2xl p-5", className)}>{children}</section>;
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-indigo-500 text-white hover:bg-indigo-400",
    ghost: "bg-white/5 text-slate-200 hover:bg-white/10",
    danger: "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
  };
  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium transition disabled:opacity-50", styles[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button title={label} aria-label={label} className="grid h-10 w-10 place-items-center rounded-2xl bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" {...props}>
      <Icon size={18} />
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn("h-11 w-full rounded-2xl border border-line bg-white/5 px-4 text-sm outline-none transition placeholder:text-slate-500 focus:border-indigo-400", className)}
        {...props}
      />
    );
  }
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn("h-11 w-full rounded-2xl border border-line bg-slate-950/70 px-4 text-sm text-slate-50 outline-none transition focus:border-indigo-400", className)}
        {...props}
      />
    );
  }
);

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "indigo" }) {
  const tones = {
    slate: "bg-slate-500/10 text-slate-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
    rose: "bg-rose-500/10 text-rose-300",
    indigo: "bg-indigo-500/10 text-indigo-300"
  };
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Progress({ value, tone = "bg-indigo-400" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/8">
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
