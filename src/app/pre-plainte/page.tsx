"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  HelpCircle,
  Info,
  MapPin,
  Phone,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react";
import { PublicFooter, PublicHeader } from "@/components/OfficialHeader";
import { useDemo } from "@/components/store";
import { Alert, Badge, Button, Field, inputCls } from "@/components/ui";
import { TYPE_INFRACTION_PRE_PLAINTE } from "@/lib/labels";
import type { TypeInfractionPrePlainte } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5;

export default function PrePlaintePage() {
  const { state, dispatch } = useDemo();

  // Étape courante
  const [step, setStep] = useState<Step>(1);

  // Étape 1 : Éligibilité légale
  const [isAuteurInconnu, setIsAuteurInconnu] = useState<boolean | null>(null);
  const [isAtteinteBiens, setIsAtteinteBiens] = useState<boolean | null>(null);
  const [isUrgence, setIsUrgence] = useState<boolean | null>(null);

  // Étape 2 : Faits & Infraction
  const [typeInfraction, setTypeInfraction] = useState<TypeInfractionPrePlainte>("VOL_SIMPLE");
  const [dateFaits, setDateFaits] = useState("");
  const [heureFaits, setHeureFaits] = useState("");
  const [lieuFaits, setLieuFaits] = useState("");
  const [description, setDescription] = useState("");
  const [prejudiceEstime, setPrejudiceEstime] = useState("");

  // Étape 3 : Coordonnées de la victime
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");

  // Étape 4 : Choix de la brigade
  const [uniteId, setUniteId] = useState(state.unites[0]?.id || "u1");

  // Statut de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dossierRef, setDossierRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Vérification si éligible pour passer à l'étape 2
  const isEligible = isAuteurInconnu === true && isAtteinteBiens === true && isUrgence === false;

  async function handleFinalSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const numeroDossier = `PP-${year}-${randomDigits}`;
    const now = nowLocal();

    const fullDateFaits = heureFaits ? `${dateFaits}T${heureFaits}:00` : `${dateFaits}T12:00:00`;

    const newPrePlainte = {
      id: uid(),
      numeroDossier,
      typeInfraction,
      dateFaits: fullDateFaits,
      lieuFaits,
      description,
      auteurInconnu: true,
      prejudiceEstime: prejudiceEstime ? parseFloat(prejudiceEstime) : undefined,
      statut: "DEPOSEE" as const,
      createdAt: now,
      victimeNom: nom,
      victimePrenom: prenom,
      victimeEmail: email,
      victimeTelephone: telephone,
      victimeAdresse: adresse,
      uniteId,
    };

    // 1. Enregistrement dans le store local réactif
    dispatch({
      type: "PRE_PLAINTE_CREATE",
      prePlainte: newPrePlainte,
    });

    // 2. Synchronisation avec la base PostgreSQL Supabase via API route
    try {
      await fetch("/api/pre-plainte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typeInfraction,
          dateFaits: fullDateFaits,
          lieuFaits,
          description,
          prejudiceEstime,
          victimeNom: nom,
          victimePrenom: prenom,
          victimeEmail: email,
          victimeTelephone: telephone,
          victimeAdresse: adresse,
          uniteId,
        }),
      });
    } catch (err) {
      console.warn("Échec synchronisation Supabase (fonctionne en local) :", err);
    }

    setIsSubmitting(false);
    setDossierRef(numeroDossier);
    setStep(5);
  }

  return (
    <>
      <PublicHeader />
      <main id="contenu" className="mx-auto max-w-4xl px-4 py-10">
        {/* Bandeau d'en-tête officiel */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gend-900">
              <Shield size={16} /> Service public de la Gendarmerie nationale
            </div>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold text-gend-900">
              Déclaration de pré-plainte en ligne
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Conformément à l&apos;article 15-3-1 du Code de procédure pénale.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded bg-red-50 p-3 text-xs text-red-900 border border-red-200">
            <Phone size={16} className="text-red-700 shrink-0" />
            <span>En cas d&apos;urgence immédiate ou de danger, composez sans attendre le <strong>17</strong> ou le <strong>112</strong>.</span>
          </div>
        </div>

        {/* Indicateur d'étapes */}
        {step < 5 && (
          <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-medium">
            <div
              className={`p-3 border-b-4 transition-colors ${
                step === 1 ? "border-b-gend-900 bg-white font-bold text-gend-900" : "border-b-line bg-gray-50 text-ink-soft"
              }`}
            >
              1. Conditions légales
            </div>
            <div
              className={`p-3 border-b-4 transition-colors ${
                step === 2 ? "border-b-gend-900 bg-white font-bold text-gend-900" : "border-b-line bg-gray-50 text-ink-soft"
              }`}
            >
              2. Faits & Préjudice
            </div>
            <div
              className={`p-3 border-b-4 transition-colors ${
                step === 3 ? "border-b-gend-900 bg-white font-bold text-gend-900" : "border-b-line bg-gray-50 text-ink-soft"
              }`}
            >
              3. Vos coordonnées
            </div>
            <div
              className={`p-3 border-b-4 transition-colors ${
                step === 4 ? "border-b-gend-900 bg-white font-bold text-gend-900" : "border-b-line bg-gray-50 text-ink-soft"
              }`}
            >
              4. Choix de la brigade
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ÉTAPE 1 : CONDITIONS LÉGALES & ÉLIGIBILITÉ                       */}
        {/* ============================================================== */}
        {step === 1 && (
          <section className="space-y-6 border border-line bg-white p-6 md:p-8 shadow-sm">
            <div className="border-l-4 border-l-gend-900 pl-4">
              <h2 className="text-xl font-bold text-gend-900">Vérification préalable d&apos;éligibilité</h2>
              <p className="mt-1 text-sm text-ink-soft">
                La pré-plainte en ligne est un dispositif encadré par la loi pour vous faire gagner du temps lors de votre rendez-vous.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {/* Question 1 : Atteinte aux biens */}
              <div className="rounded border border-line p-4 bg-gray-50/60">
                <p className="font-semibold text-gend-900">
                  1. Les faits concernent-ils une atteinte aux biens (vol, dégradation, cambriolage, escroquerie) ?
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Ce service n&apos;est pas habilité à recueillir les plaintes pour violences physiques, agressions sexuelles ou atteintes aux personnes.
                </p>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="atteinte"
                      checked={isAtteinteBiens === true}
                      onChange={() => setIsAtteinteBiens(true)}
                      className="accent-gend-900"
                    />
                    Oui, il s&apos;agit d&apos;un bien ou d&apos;une escroquerie
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="atteinte"
                      checked={isAtteinteBiens === false}
                      onChange={() => setIsAtteinteBiens(false)}
                      className="accent-gend-900"
                    />
                    Non (atteinte à la personne, violences, etc.)
                  </label>
                </div>
              </div>

              {/* Question 2 : Auteur inconnu */}
              <div className="rounded border border-line p-4 bg-gray-50/60">
                <p className="font-semibold text-gend-900">
                  2. L&apos;auteur de l&apos;infraction est-il INCONNU ?
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Si vous connaissez l&apos;identité de l&apos;auteur ou détenez des éléments permettant de l&apos;identifier directement, la télé-procédure ne peut s&apos;appliquer.
                </p>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="auteur"
                      checked={isAuteurInconnu === true}
                      onChange={() => setIsAuteurInconnu(true)}
                      className="accent-gend-900"
                    />
                    Oui, l&apos;auteur m&apos;est totalement inconnu
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="auteur"
                      checked={isAuteurInconnu === false}
                      onChange={() => setIsAuteurInconnu(false)}
                      className="accent-gend-900"
                    />
                    Non, je connais son identité ou suspecte quelqu&apos;un
                  </label>
                </div>
              </div>

              {/* Question 3 : Urgence */}
              <div className="rounded border border-line p-4 bg-gray-50/60">
                <p className="font-semibold text-gend-900">
                  3. La situation nécessite-t-elle une intervention de police secours d&apos;urgence ?
                </p>
                <div className="mt-3 flex gap-4">
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="urgence"
                      checked={isUrgence === false}
                      onChange={() => setIsUrgence(false)}
                      className="accent-gend-900"
                    />
                    Non, les faits sont passés et ne présentent pas de péril immédiat
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="urgence"
                      checked={isUrgence === true}
                      onChange={() => setIsUrgence(true)}
                      className="accent-gend-900"
                    />
                    Oui, l&apos;événement est en cours
                  </label>
                </div>
              </div>
            </div>

            {/* Avertissement si non éligible */}
            {(isAuteurInconnu === false || isAtteinteBiens === false || isUrgence === true) && (
              <Alert tone="error" title="Procédure non éligible à la pré-plainte en ligne">
                <div className="mt-2 text-sm space-y-2">
                  <p>
                    Au regard des conditions légales (art. 15-3-1 du CPP), votre situation ne peut faire l&apos;objet d&apos;une pré-plainte en ligne :
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    {isUrgence === true && (
                      <li className="font-bold text-red-800">
                        Urgence en cours : Composez immédiatement le 17 ou le 112 par téléphone.
                      </li>
                    )}
                    {isAuteurInconnu === false && (
                      <li>
                        Auteur identifié : Vous devez vous présenter sans rendez-vous préalable à la brigade de gendarmerie la plus proche pour déposer plainte directement auprès d&apos;un officier de police judiciaire.
                      </li>
                    )}
                    {isAtteinteBiens === false && (
                      <li>
                        Atteinte aux personnes / violences : Vous devez être reçu directement et auditionné en brigade ou commissariat.
                      </li>
                    )}
                  </ul>
                </div>
              </Alert>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <Link href="/">
                <Button variant="ghost" icon={<ArrowLeft size={16} />}>
                  Retour à l&apos;accueil
                </Button>
              </Link>
              <Button
                disabled={!isEligible}
                onClick={() => setStep(2)}
                icon={<ArrowRight size={16} />}
              >
                Continuer vers la déclaration
              </Button>
            </div>
          </section>
        )}

        {/* ============================================================== */}
        {/* ÉTAPE 2 : FAITS & NATURE DU PRÉJUDICE                           */}
        {/* ============================================================== */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(3);
            }}
            className="space-y-6 border border-line bg-white p-6 md:p-8 shadow-sm"
          >
            <div className="border-l-4 border-l-gend-900 pl-4">
              <h2 className="text-xl font-bold text-gend-900">Description précise des faits</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Décrivez les circonstances afin de préparer le procès-verbal d&apos;audition.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Nature de l'atteinte constatée" required>
                <select
                  className={inputCls}
                  value={typeInfraction}
                  onChange={(e) => setTypeInfraction(e.target.value as TypeInfractionPrePlainte)}
                  required
                >
                  {Object.entries(TYPE_INFRACTION_PRE_PLAINTE).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date approximative ou exacte des faits" required>
                  <input
                    type="date"
                    required
                    className={inputCls}
                    value={dateFaits}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setDateFaits(e.target.value)}
                  />
                </Field>
                <Field label="Heure estimée (facultatif)">
                  <input
                    type="time"
                    className={inputCls}
                    value={heureFaits}
                    onChange={(e) => setHeureFaits(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Lieu précis de commission de l'infraction" required hint="Ex: Parking du centre commercial, 12 rue des Ormes, Valmont-sur-Loire">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-3 text-ink-soft" />
                  <input
                    type="text"
                    required
                    placeholder="Adresse complète ou repère géographique précis"
                    className={`${inputCls} pl-9`}
                    value={lieuFaits}
                    onChange={(e) => setLieuFaits(e.target.value)}
                  />
                </div>
              </Field>

              <Field label="Description circonstanciée des faits constatés" required hint="Détaillez les objets dérobés, les moyens utilisés (vitre brisée, serrure forcée), les numéros de série éventuels.">
                <textarea
                  rows={5}
                  required
                  placeholder="Ex : J'ai constaté ce matin en descendant dans mon garage que la porte d'accès avait été forcée avec un pied de biche. Deux vélos électriques de marque Kalkhoff ont disparu ainsi qu'une boîte à outils..."
                  className={inputCls}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              <Field label="Montant estimé du préjudice matériel (en euros, facultatif)" hint="Facilitera la transmission à votre compagnie d'assurance">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex : 2450.00"
                  className={inputCls}
                  value={prejudiceEstime}
                  onChange={(e) => setPrejudiceEstime(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} icon={<ArrowLeft size={16} />}>
                Retour aux conditions
              </Button>
              <Button type="submit" icon={<ArrowRight size={16} />}>
                Continuer vers mes coordonnées
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* ÉTAPE 3 : COORDONNÉES DE LA VICTIME                            */}
        {/* ============================================================== */}
        {step === 3 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(4);
            }}
            className="space-y-6 border border-line bg-white p-6 md:p-8 shadow-sm"
          >
            <div className="border-l-4 border-l-gend-900 pl-4">
              <h2 className="text-xl font-bold text-gend-900">Identité du plaignant</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Ces informations sont nécessaires pour vous contacter et préparer votre convocation en brigade.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nom de famille" required>
                  <input
                    type="text"
                    required
                    className={inputCls}
                    placeholder="DUPONT"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </Field>
                <Field label="Prénom(s)" required>
                  <input
                    type="text"
                    required
                    className={inputCls}
                    placeholder="Jean-Marc"
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Adresse électronique (Email)" required hint="Votre confirmation et numéro de dossier y seront envoyés">
                  <input
                    type="email"
                    required
                    className={inputCls}
                    placeholder="jean.dupont@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
                <Field label="Numéro de téléphone mobile" required hint="Pour vous contacter si des éléments sont retrouvés">
                  <input
                    type="tel"
                    required
                    className={inputCls}
                    placeholder="06 12 34 56 78"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Adresse postale du domicile" required>
                <input
                  type="text"
                  required
                  placeholder="14 avenue de la République, 45000 Ville"
                  className={inputCls}
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <Button type="button" variant="ghost" onClick={() => setStep(2)} icon={<ArrowLeft size={16} />}>
                Retour aux faits
              </Button>
              <Button type="submit" icon={<ArrowRight size={16} />}>
                Continuer vers le choix de la brigade
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* ÉTAPE 4 : CHOIX DE LA BRIGADE & CONFIRMATION                   */}
        {/* ============================================================== */}
        {step === 4 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6 border border-line bg-white p-6 md:p-8 shadow-sm">
            <div className="border-l-4 border-l-gend-900 pl-4">
              <h2 className="text-xl font-bold text-gend-900">Choix de la brigade & Envoi</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Sélectionnez l&apos;unité territoriale de gendarmerie dans laquelle vous souhaitez signer votre procès-verbal de plainte.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Unité de gendarmerie de rattachement" required hint="Choisissez la brigade la plus proche de votre domicile ou du lieu de l'infraction">
                <select
                  className={inputCls}
                  value={uniteId}
                  onChange={(e) => setUniteId(e.target.value)}
                  required
                >
                  {state.unites.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom} ({u.type})
                    </option>
                  ))}
                </select>
              </Field>

              {/* Récapitulatif clair */}
              <div className="rounded border border-line bg-gray-50 p-5 space-y-3">
                <h3 className="font-bold text-sm text-gend-900 uppercase tracking-wide">
                  Récapitulatif de votre déclaration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-ink-soft">Plaignant :</span> <strong>{prenom} {nom.toUpperCase()}</strong>
                  </div>
                  <div>
                    <span className="text-ink-soft">Contact :</span> {email} ({telephone})
                  </div>
                  <div>
                    <span className="text-ink-soft">Infraction :</span> {TYPE_INFRACTION_PRE_PLAINTE[typeInfraction]}
                  </div>
                  <div>
                    <span className="text-ink-soft">Lieu :</span> {lieuFaits}
                  </div>
                  <div>
                    <span className="text-ink-soft">Date :</span> {dateFaits} {heureFaits}
                  </div>
                  {prejudiceEstime && (
                    <div>
                      <span className="text-ink-soft">Préjudice estimé :</span> {prejudiceEstime} €
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement solennel */}
              <div className="rounded border border-line p-4 bg-blue-50/50 text-xs text-gend-900 space-y-2">
                <div className="flex items-start gap-2 font-semibold">
                  <Info size={16} className="text-gend-900 shrink-0 mt-0.5" />
                  <span>Avertissement légal :</span>
                </div>
                <p>
                  Conformément à l&apos;article 434-26 du Code pénal, le fait de dénoncer mensongèrement à l&apos;autorité judiciaire des faits constitutifs d&apos;un crime ou d&apos;un délit est puni de six mois d&apos;emprisonnement et de 7 500 euros d&apos;amende.
                </p>
                <p className="font-semibold text-gend-900">
                  La présente démarche en ligne ne constitue pas une plainte définitive. Vous devez vous présenter en brigade pour signer le procès-verbal.
                </p>
              </div>
            </div>

            {errorMsg && (
              <Alert tone="error" title="Erreur">
                {errorMsg}
              </Alert>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-line">
              <Button type="button" variant="ghost" onClick={() => setStep(3)} icon={<ArrowLeft size={16} />}>
                Retour aux coordonnées
              </Button>
              <Button type="submit" disabled={isSubmitting} icon={<FileCheck2 size={16} />}>
                {isSubmitting ? "Enregistrement en cours..." : "Valider et transmettre la pré-plainte"}
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* ÉTAPE 5 : CONFIRMATION OFFICIELLE & SUIVI                      */}
        {/* ============================================================== */}
        {step === 5 && (
          <div className="space-y-6 border border-line bg-white p-6 md:p-10 shadow-sm border-t-4 border-t-emerald-700">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-800">
              <CheckCircle2 size={18} /> Télé-procédure enregistrée
            </div>

            <h2 className="text-2xl font-bold text-gend-900">
              Votre pré-plainte en ligne a été enregistrée avec succès
            </h2>

            <div className="rounded border border-emerald-200 bg-emerald-50/70 p-5">
              <p className="text-xs uppercase font-semibold text-emerald-900">Numéro d&apos;enregistrement du dossier</p>
              <p className="text-3xl font-mono font-bold text-gend-900 tracking-wider mt-1">{dossierRef}</p>
              <p className="text-xs text-ink-soft mt-2">
                Un accusé de réception a été envoyé à l&apos;adresse <strong>{email}</strong>. Conservez précieusement ce numéro.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gend-900 text-base">Prochaines démarches obligatoires :</h3>
              <ol className="list-decimal pl-5 space-y-3 text-sm text-ink-soft">
                <li>
                  <strong>Prise de contact par la brigade :</strong> Un militaire de l&apos;unité sélectionnée ({state.unites.find((u) => u.id === uniteId)?.nom}) examinera votre déclaration sous 48 heures ouvrées pour fixer un créneau de signature de votre procès-verbal.
                </li>
                <li>
                  <strong>Documents à apporter lors de votre venue :</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Une pièce d&apos;identité officielle en cours de validité (CNI, passeport).</li>
                    <li>Votre numéro de dossier : <span className="font-mono font-bold text-gend-900">{dossierRef}</span>.</li>
                    <li>Les factures d&apos;achat, photographies des objets dérobés ou dégradés, et justificatifs de propriété.</li>
                  </ul>
                </li>
                <li>
                  <strong>Démarches d&apos;assurance :</strong> Vous recevrez un récépissé de dépôt de plainte lors de la signature en brigade, document exigé par votre assureur pour le remboursement du sinistre.
                </li>
              </ol>
            </div>

            <div className="flex flex-wrap gap-3 pt-6 border-t border-line">
              <Link href="/">
                <Button>Retourner à l&apos;accueil public</Button>
              </Link>
              <Link href="/connexion">
                <Button variant="secondary">Accès réservé aux personnels de gendarmerie</Button>
              </Link>
            </div>
          </div>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
