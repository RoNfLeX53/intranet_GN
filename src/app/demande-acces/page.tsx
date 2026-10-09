"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound, Lock, Send, ShieldCheck } from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/OfficialHeader";
import { useDemo } from "@/components/store";
import { Alert, Button, Field, inputCls } from "@/components/ui";
import { GRADE_ABBR, GRADE_LABEL } from "@/lib/labels";
import type { Grade, QualifJudiciaire } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

export default function DemandeAccesPage() {
  const { state, dispatch } = useDemo();

  const [matricule, setMatricule] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [grade, setGrade] = useState<Grade>("GENDARME");
  const [uniteId, setUniteId] = useState("u1");
  const [affectation, setAffectation] = useState("");
  const [email, setEmail] = useState("");
  const [qualification, setQualification] = useState<QualifJudiciaire>("APJ20");
  const [motif, setMotif] = useState("");
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const ref = `HAB-${new Date().getFullYear()}-${String(100 + state.habilitations.length + 1).padStart(4, "0")}`;
    const now = nowLocal();

    const detailMotif = `[Demande d'accès initial personnel] Matricule : ${matricule} | Grade : ${GRADE_ABBR[grade]} | Affectation : ${affectation} | Unité : ${
      state.unites.find((u) => u.id === uniteId)?.nom ?? uniteId
    } | Qualif : ${qualification} | Email : ${email} | Renseignements : ${motif}`;

    dispatch({
      type: "HABILITATION_CREATE",
      demande: {
        id: uid(),
        reference: ref,
        demandeurId: `pending-${matricule}`,
        demandeurNom: `${GRADE_ABBR[grade]} ${prenom} ${nom.toUpperCase()} (Mle ${matricule})`,
        demandeurEmail: email,
        type: "ACCES_PORTAIL",
        motif: detailMotif,
        dureeMois: 0,
        statut: "EN_ATTENTE",
        createdAt: now,
        historique: [
          {
            date: now,
            acteurId: `pending-${matricule}`,
            action: `Demande d'accès initial déposée par ${prenom} ${nom.toUpperCase()} (Mle ${matricule})`,
          },
        ],
      },
    });

    setSubmittedRef(ref);
  }

  return (
    <>
      <PublicHeader />
      <main id="contenu" className="mx-auto max-w-3xl px-4 py-12">
        <div className="border border-line bg-white p-6 md:p-10 shadow-sm border-t-4 border-t-gend-900">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gend-900">
            <KeyRound size={16} /> Personnels en service
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold text-gend-900">
            Demande d&apos;accès à l&apos;intranet Sentinelle
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            Vous êtes militaire de la Gendarmerie nationale en service actif (BTA, BR, PSIG, État-major) ? Remplissez ce formulaire d&apos;immatriculation.
            Votre demande sera vérifiée et validée par le bureau RH / DSI avant l&apos;ouverture et l&apos;attribution de votre mot de passe d&apos;accès.
          </p>

          {submittedRef ? (
            <div className="mt-6 space-y-4">
              <Alert tone="success" title="Demande enregistrée avec succès">
                <div className="space-y-2 mt-1">
                  <p className="text-sm">
                    Votre demande a été transmise au bureau de gestion des accès sous la référence <strong>{submittedRef}</strong>.
                  </p>
                  <p className="text-sm text-ink-soft">
                    Un officier ou administrateur RH validera votre inscription dans l&apos;annuaire opérationnel. Votre mot de passe de connexion vous sera ensuite remis.
                  </p>
                </div>
              </Alert>

              <div className="pt-4 flex gap-3">
                <Link href="/connexion">
                  <Button>Retour à l&apos;écran de connexion</Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary">Retour à l&apos;accueil</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Matricule officiel (6 chiffres)" htmlFor="acc-matricule" hint="Ex: 245781">
                  <input
                    id="acc-matricule"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className={`${inputCls} font-mono`}
                    maxLength={6}
                    required
                  />
                </Field>

                <Field label="Grade d'active" htmlFor="acc-grade">
                  <select
                    id="acc-grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as Grade)}
                    className={inputCls}
                  >
                    {(Object.keys(GRADE_LABEL) as Grade[]).map((g) => (
                      <option key={g} value={g}>{GRADE_LABEL[g]} ({GRADE_ABBR[g]})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Nom de famille" htmlFor="acc-nom">
                  <input
                    id="acc-nom"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label="Prénom" htmlFor="acc-prenom">
                  <input
                    id="acc-prenom"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label="Unité de rattachement" htmlFor="acc-unite">
                  <select
                    id="acc-unite"
                    value={uniteId}
                    onChange={(e) => setUniteId(e.target.value)}
                    className={inputCls}
                  >
                    {state.unites.map((u) => (
                      <option key={u.id} value={u.id}>{u.nom} (code {u.code})</option>
                    ))}
                  </select>
                </Field>

                <Field label="Emploi / Affectation" htmlFor="acc-affectation" hint="Ex: Enquêteur groupe judiciaire">
                  <input
                    id="acc-affectation"
                    value={affectation}
                    onChange={(e) => setAffectation(e.target.value)}
                    className={inputCls}
                    required
                  />
                </Field>

                <Field label="Qualification judiciaire" htmlFor="acc-qualif">
                  <select
                    id="acc-qualif"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value as QualifJudiciaire)}
                    className={inputCls}
                  >
                    <option value="AUCUNE">Aucune</option>
                    <option value="APJ21">APJA (art. 21 CPP)</option>
                    <option value="APJ20">APJ (art. 20 CPP)</option>
                    <option value="OPJ">OPJ (art. 16 CPP)</option>
                  </select>
                </Field>

                <Field label="Adresse électronique professionnelle" htmlFor="acc-email" hint="Domaine gendarmerie / interieur.gouv.fr">
                  <input
                    id="acc-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls}
                    placeholder="prenom.nom@gendarmerie.interieur.gouv.fr"
                    required
                  />
                </Field>
              </div>

              <Field
                label="Justification de la demande d'accès"
                hint="Précisez votre unité et vos fonctions pour accélérer la validation RH"
                htmlFor="acc-motif"
              >
                <textarea
                  id="acc-motif"
                  rows={3}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className={inputCls}
                  placeholder="Prise de fonction à la brigade, besoin de consultation et rédaction des procédures..."
                  required
                />
              </Field>

              <div className="pt-2">
                <Button type="submit" className="w-full justify-center">
                  <Send size={16} aria-hidden /> Envoyer la demande d&apos;accès intranet
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
