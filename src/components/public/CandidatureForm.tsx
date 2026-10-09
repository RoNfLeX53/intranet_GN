"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { useDemo } from "@/components/store";
import { Alert, Button, Field, inputCls } from "@/components/ui";
import { OFFRE_LABEL } from "@/lib/labels";
import type { OffreType } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

type Errors = Partial<Record<"offre" | "nom" | "prenom" | "email" | "dateNaissance" | "niveauEtudes" | "rgpd", string>>;

const NIVEAUX = ["Sans diplôme", "CAP / BEP", "Baccalauréat", "Bac+2", "Bac+3", "Bac+5", "Doctorat"];

export function CandidatureForm() {
  const { dispatch, state } = useDemo();
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const errs: Errors = {};
    if (!v("offre")) errs.offre = "Sélectionnez une offre.";
    if (v("nom").length < 2) errs.nom = "Le nom est obligatoire.";
    if (v("prenom").length < 2) errs.prenom = "Le prénom est obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v("email"))) errs.email = "Format attendu : nom@domaine.fr";
    if (!v("dateNaissance")) errs.dateNaissance = "La date de naissance est obligatoire.";
    if (!v("niveauEtudes")) errs.niveauEtudes = "Sélectionnez votre niveau d'études.";
    if (!fd.get("rgpd")) errs.rgpd = "Votre consentement est requis pour traiter la candidature.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const reference = `CAND-2026-${String(430 + state.candidatures.length).padStart(4, "0")}`;
    dispatch({
      type: "CANDIDATURE_CREATE",
      candidature: {
        id: uid(),
        reference,
        offre: v("offre") as OffreType,
        nom: v("nom"),
        prenom: v("prenom"),
        email: v("email"),
        dateNaissance: v("dateNaissance"),
        niveauEtudes: v("niveauEtudes"),
        etape: "DOSSIER_RECU",
        createdAt: nowLocal(),
        historique: [],
      },
    });
    setDone(reference);
    e.currentTarget.reset();
  }

  const aria = (k: keyof Errors) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-error` } : {});

  return (
    <div className="border border-line bg-white p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gend-900">Déposer une candidature</h2>
      <p className="mt-1 text-sm text-ink-soft">Tous les champs sont obligatoires. Formulaire de démonstration : n&apos;y saisissez pas de données réelles.</p>

      <div aria-live="polite" className="mt-4">
        {done && (
          <Alert tone="success" title="Candidature enregistrée">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} aria-hidden /> Référence <strong className="font-mono">{done}</strong>. Elle est visible dans le back-office « Pôle recrutement ».
            </span>
          </Alert>
        )}
      </div>

      <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-5 md:grid-cols-2">
        <fieldset className="md:col-span-2" {...(errors.offre ? { "aria-describedby": "offre-error" } : {})}>
          <legend className="mb-2 text-sm font-medium">Offre visée</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(OFFRE_LABEL) as OffreType[]).map((o) => (
              <label key={o} className="flex cursor-pointer items-center gap-2 border border-line px-3 py-2.5 text-sm has-[:checked]:border-gend-900 has-[:checked]:bg-gend-50">
                <input type="radio" name="offre" value={o} className="accent-gend-900" />
                {OFFRE_LABEL[o]}
              </label>
            ))}
          </div>
          {errors.offre && <p id="offre-error" className="mt-1 text-xs font-medium text-marianne-dark">{errors.offre}</p>}
        </fieldset>

        <Field label="Nom" htmlFor="nom" error={errors.nom}>
          <input id="nom" name="nom" autoComplete="family-name" className={inputCls} {...aria("nom")} />
        </Field>
        <Field label="Prénom" htmlFor="prenom" error={errors.prenom}>
          <input id="prenom" name="prenom" autoComplete="given-name" className={inputCls} {...aria("prenom")} />
        </Field>
        <Field label="Adresse électronique" hint="Format attendu : nom@domaine.fr" htmlFor="email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" className={inputCls} {...aria("email")} />
        </Field>
        <Field label="Date de naissance" htmlFor="dateNaissance" error={errors.dateNaissance}>
          <input id="dateNaissance" name="dateNaissance" type="date" autoComplete="bday" className={inputCls} {...aria("dateNaissance")} />
        </Field>
        <Field label="Niveau d'études" htmlFor="niveauEtudes" error={errors.niveauEtudes} className="md:col-span-2">
          <select id="niveauEtudes" name="niveauEtudes" defaultValue="" className={inputCls} {...aria("niveauEtudes")}>
            <option value="" disabled>
              Sélectionner une option
            </option>
            {NIVEAUX.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </Field>

        <div className="md:col-span-2">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="rgpd" className="mt-1 h-4 w-4 accent-gend-900" {...aria("rgpd")} />
            <span>
              J&apos;accepte que mes données soient traitées pour l&apos;instruction de ma candidature. Elles sont conservées 2 ans maximum puis
              purgées automatiquement (RGPD, art. 5-1-e).
            </span>
          </label>
          {errors.rgpd && <p id="rgpd-error" className="mt-1 text-xs font-medium text-marianne-dark">{errors.rgpd}</p>}
        </div>

        <div className="md:col-span-2">
          <Button type="submit">Envoyer ma candidature</Button>
        </div>
      </form>
    </div>
  );
}
