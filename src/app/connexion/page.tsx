"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Lock, ShieldAlert, ShieldCheck, UserCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/OfficialHeader";
import { useDemo } from "@/components/store";
import { Alert, Button, Field, inputCls } from "@/components/ui";

export default function ConnexionPage() {
  const { state, dispatch } = useDemo();
  const router = useRouter();

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const loginTrim = identifiant.trim().toLowerCase();
    const passTrim = motDePasse.trim();

    if (!loginTrim || !passTrim) {
      setError("Veuillez renseigner votre identifiant et votre mot de passe.");
      return;
    }

    // Chercher l'agent correspondant soit par matricule soit par identifiant
    const agent = state.agents.find(
      (a) =>
        (a.matricule.toLowerCase() === loginTrim ||
          (a.identifiant && a.identifiant.toLowerCase() === loginTrim)) &&
        a.statut !== "RADIE"
    );

    if (!agent) {
      setError("Identifiant ou mot de passe invalide. En cas d'incorporation récente, vérifiez auprès de l'administrateur.");
      return;
    }

    // Vérifier mot de passe (si défini dans le profil ou fallback Gend2026! / Admin2026!)
    const expectedPassword = agent.motDePasse ?? (agent.role === "ADMIN" ? "Admin2026!" : "Gend2026!");

    if (passTrim !== expectedPassword) {
      setError("Mot de passe incorrect.");
      return;
    }

    // Connexion réussie
    dispatch({ type: "LOGIN", agentId: agent.id });
    router.push("/intranet");
  }

  return (
    <>
      <PublicHeader />
      <main id="contenu" className="mx-auto max-w-xl px-4 py-14">
        <section className="border border-line bg-white p-8 md:p-10 shadow-sm border-t-4 border-t-gend-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-marianne">
            <Lock size={14} aria-hidden /> Accès réservé aux personnels
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gend-900">Connexion à l&apos;intranet</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Espace sécurisé de la Gendarmerie nationale. Renseignez les identifiants qui vous ont été communiqués lors de l&apos;acceptation de votre dossier ou par votre commandement.
          </p>

          {error && (
            <div className="mt-5">
              <Alert tone="error" title="Échec d'authentification">
                <span className="flex items-center gap-2">
                  <ShieldAlert size={16} aria-hidden /> {error}
                </span>
              </Alert>
            </div>
          )}

          <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
            <Field
              label="Identifiant ou Matricule"
              hint="Exemple : votre matricule (6 chiffres) ou nom d'utilisateur"
              htmlFor="login"
            >
              <input
                id="login"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                className={`${inputCls} font-mono`}
                placeholder="ex. 245781 ou admin"
                autoComplete="username"
                autoFocus
                required
              />
            </Field>

            <Field
              label="Mot de passe"
              hint="Mot de passe remis lors de l'incorporation"
              htmlFor="password"
            >
              <input
                id="password"
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={inputCls}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
            </Field>

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center">
                <KeyRound size={16} aria-hidden /> S&apos;identifier et accéder à l&apos;intranet
              </Button>
            </div>
          </form>

          <div className="mt-8 border-t border-line pt-5 text-xs text-ink-mute space-y-3">
            <div className="bg-gend-50 border border-gend-200 p-3.5 rounded text-ink">
              <p className="font-bold text-gend-900 text-sm mb-1 flex items-center gap-1.5">
                <UserCheck size={16} /> Vous êtes gendarme en service et n&apos;avez pas encore d&apos;identifiant ?
              </p>
              <p className="text-xs text-ink-soft mb-2.5">
                Déposez une demande d&apos;accès initial avec votre matricule officiel. Votre compte sera activé par le bureau RH / DSI.
              </p>
              <Link href="/demande-acces">
                <Button size="sm" variant="secondary" className="w-full sm:w-auto">
                  Déposer une demande d&apos;accès agent →
                </Button>
              </Link>
            </div>

            <p className="flex items-center gap-1.5 font-bold text-gend-900 pt-2">
              <ShieldCheck size={14} /> Accès d&apos;administration initial
            </p>
            <p>
              • <strong>Compte Administrateur RH / SI :</strong> Identifiant <code>admin</code> (ou <code>176540</code>) / Mot de passe : <code>Admin2026!</code>
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
