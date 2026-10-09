"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, KeyRound, LayoutDashboard, ScrollText, ShieldCheck, UserPlus, Users, X, type LucideIcon } from "lucide-react";
import { useCurrentUser, useDemo } from "@/components/store";
import { can, type Permission } from "@/lib/rbac";
import { UNITE_TYPE_LABEL } from "@/lib/labels";
import { cx } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** l'item est visible si l'utilisateur possède AU MOINS une de ces permissions */
  perms: Permission[];
}

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Pilotage",
    items: [{ href: "/intranet", label: "Tableau de bord", icon: LayoutDashboard, perms: ["dashboard:view"] }],
  },
  {
    section: "Activité opérationnelle",
    items: [
      { href: "/intranet/procedures", label: "Procédures judiciaires", icon: FileText, perms: ["procedures:read"] },
      { href: "/intranet/habilitations", label: "Habilitations", icon: KeyRound, perms: ["habilitations:request", "habilitations:review"] },
    ],
  },
  {
    section: "Ressources humaines",
    items: [
      { href: "/intranet/agents", label: "Effectifs & annuaire", icon: Users, perms: ["agents:read"] },
      { href: "/intranet/recrutement", label: "Pôle recrutement", icon: UserPlus, perms: ["recrutement:manage"] },
    ],
  },
  {
    section: "Sécurité",
    items: [{ href: "/intranet/audit", label: "Journal d'audit", icon: ScrollText, perms: ["audit:read"] }],
  },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useCurrentUser();
  const { state } = useDemo();
  const pathname = usePathname();
  if (!me) return null;

  const pendingReview = state.habilitations.filter((h) => h.statut === "EN_ATTENTE").length;

  const isActive = (href: string) => (href === "/intranet" ? pathname === href : pathname.startsWith(href));

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-gend-950/50 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        className={cx(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col bg-gend-900 text-white transition-transform lg:static lg:z-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation de l'intranet"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 lg:hidden">
          <span className="font-bold">Menu</span>
          <button type="button" onClick={onClose} aria-label="Fermer le menu" className="p-1 hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gend-300">Unité de rattachement</p>
          <p className="mt-1 text-sm font-bold">{me.unite.nom}</p>
          <p className="text-xs text-gend-200">
            {UNITE_TYPE_LABEL[me.unite.type]} · code {me.unite.code}
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV.map((group) => {
            const items = group.items.filter((i) => i.perms.some((p) => can(me.role, p)));
            if (!items.length) return null;
            return (
              <div key={group.section} className="mb-3">
                <p className="px-5 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-widest text-gend-300">{group.section}</p>
                <ul>
                  {items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          className={cx(
                            "flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm transition-colors",
                            active ? "border-marianne bg-white/10 font-bold" : "border-transparent text-gend-100 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <Icon size={18} aria-hidden />
                          <span className="flex-1">{item.label}</span>
                          {item.href === "/intranet/habilitations" && can(me.role, "habilitations:review") && pendingReview > 0 && (
                            <span className="rounded-full bg-marianne px-2 text-xs font-bold" aria-label={`${pendingReview} demandes en attente`}>
                              {pendingReview}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-gend-200">
          <p className="flex items-center gap-2 font-bold text-white">
            <ShieldCheck size={14} aria-hidden /> Session sécurisée
          </p>
          <p className="mt-1">Authentification forte validée · expiration après 15 min d&apos;inactivité</p>
        </div>
      </aside>
    </>
  );
}
