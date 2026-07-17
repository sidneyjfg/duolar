import { LucideIcon } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("duo-panel rounded-lg p-5 text-ink", className)}>{children}</section>;
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-clay text-white hover:bg-[#a95f45]",
    ghost: "bg-[#efe2cf] text-ink hover:bg-[#e7d7bf]",
    danger: "bg-rose-100 text-rose-700 hover:bg-rose-200"
  };
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background-color,color,transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function IconButton({ icon: Icon, label, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-lg bg-[#efe2cf] text-ink transition-[background-color,color,transform,opacity] duration-150 ease-out active:scale-[0.97] hover:bg-[#e7d7bf]",
        className
      )}
      {...props}
    >
      <Icon size={18} />
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn("h-11 w-full rounded-lg border border-line bg-white px-4 text-sm text-ink outline-none transition-colors duration-150 placeholder:text-stone-400 focus:border-clay", className)}
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
        className={cn("h-11 w-full rounded-lg border border-line bg-white px-4 text-sm text-ink outline-none transition-colors duration-150 focus:border-clay", className)}
        {...props}
      />
    );
  }
);

export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "emerald" | "amber" | "rose" | "indigo" }) {
  const tones = {
    slate: "bg-stone-200 text-stone-700",
    emerald: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    rose: "bg-rose-100 text-rose-800",
    indigo: "bg-sky-100 text-sky-800"
  };
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", tones[tone])}>{children}</span>;
}

export function Progress({ value, tone = "bg-clay" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-stone-200">
      <div className={cn("h-full rounded-full transition-[width] duration-200 ease-out", tone)} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
