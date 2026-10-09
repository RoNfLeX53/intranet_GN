"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Shield, ShieldCheck, Send, Building2, Scale } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/OfficialHeader";
import { useDemo } from "@/components/store";
import { Alert, Button, Field, inputCls } from "@/components/ui";
import { GRADE_ABBR, GRADE_LABEL, GRADES_BY_INSTITUTION, INSTITUTION_LABEL } from "@/lib/labels";
import type { Grade, Institution, QualifJudiciaire } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

export default function DemandeAccesPage() {
  const { state, dispatch } = useDemo();

  const [institution, setInstitution] = useState<Institution>("GENDARMERIE");
  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [grade, setGrade] = useState<Grade>("GENDARME");
  const [uniteId, setUniteId] = useState("u1");
  const [affectation, setAffectation] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState<QualifJudiciaire>("APJ20");
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  // Unités filtrées selon la force choisie
  const availableUnites = useMemo(() => {
    return state.unites.filter((u) => !u.institution || u.institution === institution);
  }, [state.unites, institution]);

  // Changement de force : adapter le premier grade et unité par défaut
  function handleInstitutionChange(newInst: Institution) {
    setInstitution(newInst);
    let defaultGrade: Grade = "GENDARME";
    let defaultQualif: QualifJudiciaire = "APJ20";
    let defaultEmailDomain = "gendarmerie.interieur.gouv.fr";

    if (newInst === "POLICE_NATIONALE") {
      defaultGrade = "GARDIEN_DE_LA_PAIX";
      defaultQualif = "APJ20";
      defaultEmailDomain = "police.interieur.gouv.fr";
    } else if (newInst === "JUSTICE") {
      defaultGrade = "PROCUREUR";
      defaultQualif = "MAGISTRAT";
      defaultEmailDomain = "justice.gouv.fr";
    }

    setGrade(defaultGrade);
    setQualification(defaultQualif);
    const matchingUnite = state.unites.find((u) => u.institution === newInst);
    if (matchingUnite) setUniteId(matchingUnite.id);
    if (email && email.includes("@")) {
      const prefix = email.split("@")[0];
      setEmail(`${prefix}@${defaultEmailDomain}`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const ref = `ACC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const now = nowLocal();

    const newDemande = {
      id: uid(),
      reference: ref,
      institution,
      matricule: matricule.trim(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      grade,
      uniteId,
      affectation: affectation.trim(),
      qualification,
      email: email.trim().toLowerCase(),
      motif: motif.trim(),
      statut: "EN_ATTENTE" as const,
      createdAt: now,
    };

    try {
      await fetch("/api/demandes-acces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDemande),
      });
    } catch (err) {
      console.warn("Échec sauvegarde API demande accès:", err);
    }

    dispatch({
      type: "DEMANDE_ACCES_CREATE",
      demande: newDemande,
    });

    setSubmittedRef(ref);
    setSubmitting(false);
  }

  return (
    <>
      <PublicHeader />
      <main id="contenu" className="mx-auto max-w-3xl px-4 py-12">
        <div className="border border-line bg-white p-6 md:p-10 shadow-sm border-t-4 border-t-gend-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gend-900">
            <KeyRound size={16} /> Personnels des forces de sécurité intérieure
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-gend-900">
            Demande d&apos;accès à l&apos;intranet Sentinelle
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Vous êtes militaire de la Gendarmerie nationale ou fonctionnaire de la Police nationale en service actif ? Remplissez ce formulaire d&apos;immatriculation.
            Votre demande sera vérifiée et validée par le bureau d&apos;administration des accès avant la délivrance de vos identifiants opérationnels.
          </p>

          {submittedRef ? (
            <div className="mt-6 space-y-4">
              <Alert tone="success" title="Demande enregistrée avec succès">
                <div className="space-y-2 mt-1">
                  <p className="text-sm">
                    Votre demande d&apos;accès a été transmise avec succès au bureau d&apos;administration sous la référence <strong>{submittedRef}</strong>.
                  </p>
                  <p className="text-sm text-ink-soft">
                    Un administrateur RH / SI vérifiera vos accréditations. Dès validation, votre mot de passe et vos droits d&apos;accès seront immédiatement activés sur le portail intranet.
                  </p>
                </div>
              </Alert>

              <div className="pt-4 flex flex-wrap gap-3">
                <Link href="/connexion">
                  <Button>Aller à l&apos;écran de connexion</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">Retour à l&apos;accueil</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {/* Choix de l'institution */}
              <div className="rounded-md border border-line bg-surface p-4">
                <label className="block text-xs font-bold uppercase tracking-wide text-ink-mute mb-2">
                  Corps d&apos;appartenance / Institution
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInstitutionChange("GENDARMERIE")}
                    className={`flex items-center justify-center gap-2 rounded border p-3 text-xs sm:text-sm font-bold transition-all ${
                      institution === "GENDARMERIE"
                        ? "border-gend-900 bg-gend-900 text-white shadow-sm"
                        : "border-line bg-white text-ink hover:border-gend-900"
                    }`}
                  >
                    <Shield size={16} />
                    Gendarmerie
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstitutionChange("POLICE_NATIONALE")}
                    className={`flex items-center justify-center gap-2 rounded border p-3 text-xs sm:text-sm font-bold transition-all ${
                      institution === "POLICE_NATIONALE"
                        ? "border-gend-900 bg-gend-900 text-white shadow-sm"
                        : "border-line bg-white text-ink hover:border-gend-900"
                    }`}
                  >
                    <Building2 size={16} />
                    Police nationale
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstitutionChange("JUSTICE")}
                    className={`flex items-center justify-center gap-2 rounded border p-3 text-xs sm:text-sm font-bold transition-all ${
                      institution === "JUSTICE"
                        ? "border-gend-900 bg-gend-900 text-white shadow-sm"
                        : "border-line bg-white text-ink hover:border-gend-900"
                    }`}
                  >
                    <Scale size={16} />
                    Justice / Tribunal
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    institution === "JUSTICE"
                      ? "N° d'immatriculation / Toque / CNBF"
                      : institution === "POLICE_NATIONALE"
                      ? "Identifiant RIO ou Matricule Police"
                      : "Matricule officiel (6 chiffres)"
                  }
                  htmlFor="acc-matricule"
                  hint={
                    institution === "JUSTICE"
                      ? "Ex: MAG-4512 ou CNBF-84210"
                      : institution === "POLICE_NATIONALE"
                      ? "Ex: 1234567 (RIO à 7 chiffres)"
                      : "Ex: 245781"
                  }
                >
                  <input
                    id="acc-matricule"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className={`${inputCls} font-mono`}
                    maxLength={institution === "JUSTICE" ? 12 : institution === "POLICE_NATIONALE" ? 7 : 6}
                    placeholder={
                      institution === "JUSTICE"
                        ? "MAG-4512"
                        : institution === "POLICE_NATIONALE"
                        ? "1234567"
                        : "245781"
                    }
                    required
                  />
                </Field>

                <Field label={`Titre / Grade (${INSTITUTION_LABEL[institution]})`} htmlFor="acc-grade">
                  <select
                    id="acc-grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as Grade)}
                    className={inputCls}
                  >
                    {GRADES_BY_INSTITUTION[institution].map((g) => (
                      <option key={g} value={g}>
                        {GRADE_LABEL[g]} ({GRADE_ABBR[g]})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nom de famille" htmlFor="acc-nom">
                  <input
                    id="acc-nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={inputCls}
                    placeholder="DUPONT"
                    required
                  />
                </Field>

                <Field label="Prénom" htmlFor="acc-prenom">
                  <input
                    id="acc-prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={inputCls}
                    placeholder="Jean"
                    required
                  />
                </Field>

                <Field label="Juridiction / Tribunal / Service" htmlFor="acc-unite">
                  <select
                    id="acc-unite"
                    value={uniteId}
                    onChange={(e) => setUniteId(e.target.value)}
                    className={inputCls}
                  >
                    {availableUnites.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nom} (code {u.code})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Fonction / Chambre / Cabinet"
                  htmlFor="acc-affectation"
                  hint={institution === "JUSTICE" ? "Ex: Substitut permanence, Cabinet 2, Barreau..." : "Ex: Enquêteur groupe judiciaire"}
                >
                  <input
                    id="acc-affectation"
                    value={affectation}
                    onChange={(e) => setAffectation(e.target.value)}
                    className={inputCls}
                    placeholder={institution === "JUSTICE" ? "Permanence Parquet / Cabinet d'instruction" : "Enquêteur judiciaire"}
                    required
                  />
                </Field>

                <Field label="Attribution juridique" htmlFor="acc-qualif">
                  <select
                    id="acc-qualif"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value as QualifJudiciaire)}
                    className={inputCls}
                  >
                    {institution === "JUSTICE" ? (
                      <>
                        <option value="MAGISTRAT">Magistrat (Parquet / Siège)</option>
                        <option value="AVOCAT">Avocat / Auxiliaire de justice</option>
                      </>
                    ) : (
                      <>
                        <option value="AUCUNE">Aucune</option>
                        <option value="APJ21">APJA (art. 21 CPP)</option>
                        <option value="APJ20">APJ (art. 20 CPP)</option>
                        <option value="OPJ">OPJ (art. 16 CPP)</option>
                      </>
                    )}
                  </select>
                </Field>

                <Field
                  label="Adresse électronique professionnelle"
                  htmlFor="acc-email"
                  hint={
                    institution === "JUSTICE"
                      ? "Domaine @justice.gouv.fr ou @avocat.fr"
                      : institution === "POLICE_NATIONALE"
                      ? "Domaine @police.interieur.gouv.fr"
                      : "Domaine @gendarmerie.interieur.gouv.fr"
                  }
                >
                  <input
                    id="acc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder={
                      institution === "JUSTICE"
                        ? "prenom.nom@justice.gouv.fr"
                        : institution === "POLICE_NATIONALE"
                        ? "prenom.nom@police.interieur.gouv.fr"
                        : "prenom.nom@gendarmerie.interieur.gouv.fr"
                    }
                    required
                  />
                </Field>
              </div>

              <Field
                label="Justification de la demande d'accès"
                hint="Précisez votre unité et vos attributions pour accélérer la validation administrative"
                htmlFor="acc-motif"
              >
                <textarea
                  id="acc-motif"
                  rows={3}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className={inputCls}
                  placeholder="Prise de fonction dans l'unité, besoin de consultation et de saisie des procédures et auditions..."
                  required
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" disabled={submitting} className="w-full justify-center">
                  <Send size={16} aria-hidden /> {submitting ? "Envoi en cours..." : "Envoyer la demande d'accès intranet"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
