"use client";

import { useRouter } from "next/navigation";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/OfficialHeader";
import { useDemo } from "@/components/store";
import { Alert, Button, Field, inputCls } from "@/components/ui";
import { GRADE_ABBR, ROLE_LABEL } from "@/lib/labels";
import { DEMO_ACCOUNTS } from "@/lib/mock-data";
import type { AuthRole } from "@/lib/types";

const DESCRIPTIONS: Record<AuthRole, string> = {
  AGENT: "Consultation des dossiers de l'unité, saisie de rapports, demandes d'habilitation.",
  OFFICIER: "Validation des procédures, instruction des habilitations de l'unité.",
  ADMIN: "Gestion des effectifs, attribution des rôles, recrutement, journal d'audit.",
};

export default function ConnexionPage() {
  const { state, dispatch } = useDemo();
  const router = useRouter();

  function login(role: AuthRole) {
    dispatch({ type: "SET_ROLE", role });
    router.push("/intranet");
  }

  return (
    <>
      <PublicHeader />
      <main id="contenu" className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2">
        <section className="border border-line bg-white p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-marianne">
            <Lock size={14} aria-hidden /> Accès réservé aux personnels
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gend-900">Connexion à l&apos;intranet</h1>
          <p className="mt-2 text-sm text-ink-soft">
            En production : authentification unique (OIDC) auprès du fournisseur d&apos;identité ministériel, avec second facteur obligatoire (carte agent
            / clé FIDO2).
          </p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()} aria-describedby="demo-note">
            <Field label="Identifiant (matricule)" htmlFor="login">
              <input id="login" className={inputCls} disabled placeholder="ex. 245781" autoComplete="username" />
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <input id="password" type="password" className={inputCls} disabled autoComplete="current-password" />
            </Field>
            <Button type="submit" disabled className="w-full">
              <KeyRound size={16} aria-hidden /> Se connecter avec la carte agent
            </Button>
          </form>
          <div id="demo-note" className="mt-6">
            <Alert tone="info" title="Mode démonstration">
              L&apos;authentification réelle est désactivée. Choisissez un profil fictif ci-contre pour explorer le contrôle d&apos;accès par rôles.
            </Alert>
          </div>
        </section>

        <section aria-labelledby="profils-title">
          <h2 id="profils-title" className="text-lg font-bold text-gend-900">Profils de démonstration</h2>
          <ul className="mt-4 space-y-3">
            {(Object.keys(DEMO_ACCOUNTS) as AuthRole[]).map((role) => {
              const a = state.agents.find((x) => x.id === DEMO_ACCOUNTS[role]);
              if (!a) return null;
              return (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => login(role)}
                    className="group flex w-full items-start gap-4 border border-line border-l-4 border-l-gend-900 bg-white p-5 text-left transition-colors hover:border-l-marianne hover:bg-gend-50"
                  >
                    <ShieldCheck className="mt-0.5 shrink-0 text-gend-900" size={24} aria-hidden />
                    <span className="flex-1">
                      <span className="block font-bold text-gend-900">{ROLE_LABEL[role]}</span>
                      <span className="block text-sm text-ink">
                        {GRADE_ABBR[a.grade]} {a.prenom} {a.nom.toUpperCase()} · Mle {a.matricule}
                      </span>
                      <span className="mt-1 block text-xs text-ink-mute">{DESCRIPTIONS[role]}</span>
                    </span>
                    <span className="self-center text-sm font-bold text-gend-900 group-hover:underline">Entrer →</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
