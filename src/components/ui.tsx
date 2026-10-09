"use client";

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Tone } from "@/lib/types";
import { cx } from "@/lib/utils";

/* ---------- Badge ---------- */
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-alt text-ink-soft",
  info: "bg-info-light text-info",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-marianne-light text-marianne-dark",
  navy: "bg-gend-100 text-gend-900",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded px-2 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide", TONES[tone], className)}>
      {children}
    </span>
  );
}

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "tertiary" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-gend-900 text-white hover:bg-gend-800",
  secondary: "border border-gend-900 bg-white text-gend-900 hover:bg-gend-50",
  tertiary: "text-gend-900 hover:bg-gend-50",
  danger: "bg-marianne text-white hover:bg-marianne-dark",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Card ---------- */
export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("border border-line bg-white", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
          {title && <h2 className="text-base font-bold text-gend-900">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

/* ---------- Page header ---------- */
export function PageHeader({ title, subtitle, breadcrumb, actions }: { title: string; subtitle?: string; breadcrumb?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6">
      {breadcrumb && <nav aria-label="Fil d'Ariane" className="mb-2 text-xs text-ink-mute">{breadcrumb}</nav>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gend-900 md:text-[1.75rem]">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-mute">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------- Form field (style DSFR : fond gris, filet inférieur) ---------- */
export const inputCls =
  "w-full rounded-t border-0 border-b-2 border-ink bg-surface-alt px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:border-gend-900 focus:outline-none focus:ring-2 focus:ring-gend-500/40 aria-[invalid=true]:border-marianne";

export function Field({ label, hint, error, htmlFor, children, className }: { label: string; hint?: string; error?: string; htmlFor: string; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {hint && <span className="block text-xs font-normal text-ink-mute">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-marianne-dark" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ---------- Alert ---------- */
export function Alert({ tone = "info", title, children }: { tone?: Tone; title?: string; children?: ReactNode }) {
  const border: Record<Tone, string> = {
    neutral: "border-ink-mute",
    info: "border-info",
    success: "border-success",
    warning: "border-warning",
    error: "border-marianne",
    navy: "border-gend-900",
  };
  return (
    <div className={cx("border-l-4 bg-white px-4 py-3 text-sm shadow-sm", border[tone])} role={tone === "error" ? "alert" : "status"}>
      {title && <p className="font-bold text-ink">{title}</p>}
      {children && <div className="text-ink-soft">{children}</div>}
    </div>
  );
}

/* ---------- KPI tile ---------- */
export function Kpi({ label, value, hint, icon, accent = "navy" }: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; accent?: "navy" | "red" }) {
  return (
    <div className={cx("border border-line bg-white p-4", accent === "red" ? "border-t-4 border-t-marianne" : "border-t-4 border-t-gend-900")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">{label}</p>
        {icon && <span className="text-gend-700" aria-hidden>{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold text-gend-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-mute">{hint}</p>}
    </div>
  );
}

/* ---------- Modal (dialog natif : piège du focus + Échap gérés par le navigateur) ---------- */
export function Modal({ open, onClose, title, children, size = "md" }: { open: boolean; onClose: () => void; title: string; children: ReactNode; size?: "md" | "lg" }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cx("w-[calc(100%-2rem)] border-t-4 border-t-gend-900 bg-white p-0 shadow-2xl backdrop:bg-gend-950/60", size === "lg" ? "max-w-3xl" : "max-w-xl")}
    >
      {open && (
        <div>
          <div className="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 id={titleId} className="text-lg font-bold text-gend-900">{title}</h2>
            <button type="button" onClick={onClose} className="p-1 text-ink-mute hover:bg-surface hover:text-ink" aria-label="Fermer la fenêtre">
              <X size={20} />
            </button>
          </div>
          <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
        </div>
      )}
    </dialog>
  );
}

/* ---------- Table helpers ---------- */
export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th scope="col" className={cx("whitespace-nowrap px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-ink-soft", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cx("px-4 py-3 align-top text-sm", className)}>{children}</td>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-4 py-10 text-center text-sm text-ink-mute">{children}</p>;
}
