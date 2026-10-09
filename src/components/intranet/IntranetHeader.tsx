"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, LogOut, Menu } from "lucide-react";
import { BlocMarque, EmblemeFictif } from "@/components/OfficialHeader";
import { useCurrentUser, useDemo } from "@/components/store";
import { Badge, Button } from "@/components/ui";
import { GRADE_ABBR, ROLE_LABEL } from "@/lib/labels";
import type { AuthRole } from "@/lib/types";

export function IntranetHeader({ onMenu }: { onMenu: () => void }) {
  const me = useCurrentUser();
  const { dispatch } = useDemo();
  const router = useRouter();

  return (
    <header className="z-30 shrink-0 border-b border-line bg-white">
      <div className="flex items-center justify-center gap-2 bg-marianne px-4 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-white">
        <Lock size={12} aria-hidden />
        Environnement restreint — Diffusion restreinte · Accès tracé et journalisé · Données fictives
      </div>
      <div className="flex items-center gap-4 px-4 py-2.5 lg:px-6">
        <button type="button" onClick={onMenu} className="p-2 text-gend-900 hover:bg-gend-50 lg:hidden" aria-label="Ouvrir le menu de navigation">
          <Menu size={22} />
        </button>
        <Link href="/intranet" className="flex items-center gap-4" aria-label="Tableau de bord Sentinelle">
          <BlocMarque compact />
          <span className="hidden h-10 w-px bg-line md:block" aria-hidden />
          <span className="hidden items-center gap-2 md:flex">
            <EmblemeFictif className="h-9 w-8" />
            <span>
              <span className="block font-bold text-gend-900">Sentinelle — Intranet</span>
              <span className="block text-xs text-ink-mute">Portail interne de l&apos;unité</span>
            </span>
          </span>
        </Link>

        {me && (
          <div className="ml-auto flex items-center gap-3">
            <label className="hidden items-center gap-2 text-xs text-ink-mute xl:flex">
              Profil de démo
              <select
                value={me.role}
                onChange={(e) => dispatch({ type: "SET_ROLE", role: e.target.value as AuthRole })}
                className="border-b-2 border-ink bg-surface-alt px-2 py-1 text-xs text-ink"
              >
                <option value="AGENT">{ROLE_LABEL.AGENT}</option>
                <option value="OFFICIER">{ROLE_LABEL.OFFICIER}</option>
                <option value="ADMIN">{ROLE_LABEL.ADMIN}</option>
              </select>
            </label>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-ink">
                {GRADE_ABBR[me.agent.grade]} {me.agent.prenom} {me.agent.nom.toUpperCase()}
              </p>
              <p className="flex items-center justify-end gap-2 text-xs text-ink-mute">
                Mle {me.agent.matricule} <Badge tone={me.role === "ADMIN" ? "error" : me.role === "OFFICIER" ? "navy" : "info"}>{ROLE_LABEL[me.role]}</Badge>
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                dispatch({ type: "SET_ROLE", role: "VISITEUR" });
                router.push("/connexion");
              }}
            >
              <LogOut size={16} aria-hidden /> <span className="hidden md:inline">Se déconnecter</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
