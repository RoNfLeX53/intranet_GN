"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  Gavel,
  Info,
  MapPin,
  Printer,
  Scale,
  Shield,
  ShieldAlert,
  User,
  X,
} from "lucide-react";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Field, inputCls, Modal } from "@/components/ui";
import { GRADE_ABBR, GRADE_LABEL, QUALIF_LABEL, TYPE_AUDITION, TYPE_DOSSIER } from "@/lib/labels";
import type { Audition, Procedure, TypeAudition, TypeDossier } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

interface AuditionModalProps {
  procedure: Procedure;
  initialData?: Partial<Audition>;
  open: boolean;
  onClose: () => void;
  onSaved?: (audition: Audition) => void;
}

export function AuditionModal({
  procedure,
  initialData,
  open,
  onClose,
  onSaved,
}: AuditionModalProps) {
  const { dispatch } = useDemo();
  const me = useCurrentUser()!;

  // Mode de vue : "form" (saisie) ou "pv" (rendu officiel imprimable)
  const [viewMode, setViewMode] = useState<"form" | "pv">("form");

  // Type d'audition
  const [typeAudition, setTypeAudition] = useState<TypeAudition>(
    initialData?.typeAudition || "VICTIME_PLAINTE"
  );
  const [cadreLegal, setCadreLegal] = useState<TypeDossier>(
    procedure.type || "ENQUETE_PRELIMINAIRE"
  );

  // État civil de la personne entendue
  const [nom, setNom] = useState(initialData?.nom || "");
  const [nomUsage, setNomUsage] = useState(initialData?.nomUsage || "");
  const [prenom, setPrenom] = useState(initialData?.prenom || "");
  const [dateNaissance, setDateNaissance] = useState(
    initialData?.dateNaissance ? initialData.dateNaissance.slice(0, 10) : ""
  );
  const [lieuNaissance, setLieuNaissance] = useState(initialData?.lieuNaissance || "");
  const [nationalite, setNationalite] = useState(initialData?.nationalite || "Française");
  const [profession, setProfession] = useState(initialData?.profession || "");
  const [domicile, setDomicile] = useState(initialData?.domicile || "");
  const [telephone, setTelephone] = useState(initialData?.telephone || "");
  const [email, setEmail] = useState(initialData?.email || "");

  // Droits & formalités
  const [droitsNotifies, setDroitsNotifies] = useState(true);
  const [avocatDemande, setAvocatDemande] = useState(false);
  const [avocatNom, setAvocatNom] = useState("");
  const [interprete, setInterprete] = useState(false);
  const [plainteDeposee, setPlainteDeposee] = useState(
    typeAudition === "VICTIME_PLAINTE"
  );
  const [prejudiceChiffre, setPrejudiceChiffre] = useState(
    initialData?.prejudiceChiffre ? String(initialData.prejudiceChiffre) : ""
  );

  // Déclarations
  const defaultTextForType = (type: TypeAudition) => {
    if (type === "VICTIME_PLAINTE") {
      return (
        initialData?.declarations ||
        `QUESTION : Que pouvez-vous nous exposer concernant les faits dont vous avez été victime ?\n` +
          `RÉPONSE : Je viens déposer plainte pour les faits suivants survenus à ${procedure.lieu}.\n\n` +
          `QUESTION : Pouvez-vous détailler avec précision le déroulement des faits et les constatations effectuées ?\n` +
          `RÉPONSE : \n\n` +
          `QUESTION : Pouvez-vous nous fournir le signalement d'un ou plusieurs auteurs ou des éléments matériels ?\n` +
          `RÉPONSE : L'auteur m'est inconnu.\n\n` +
          `QUESTION : Avez-vous subi un préjudice matériel ou physique ? Pouvez-vous en chiffrer le montant ?\n` +
          `RÉPONSE : \n\n` +
          `QUESTION : Déclarez-vous déposer plainte pour ces faits et vous constituer partie civile ?\n` +
          `RÉPONSE : Oui, je déclare déposer plainte et me réserve le droit de réclamer réparation de mon entier préjudice.`
      );
    }
    if (type === "TEMOIN") {
      return (
        `QUESTION : Que pouvez-vous nous déclarer concernant les faits constatés à ${procedure.lieu} ?\n` +
          `RÉPONSE : \n\n` +
          `QUESTION : À quelle heure précise vous trouviez-vous sur les lieux et quelles personnes avez-vous remarquées ?\n` +
          `RÉPONSE : \n\n` +
          `QUESTION : Avez-vous d'autres précisions ou éléments à porter à notre connaissance ?\n` +
          `RÉPONSE : C'est tout ce que j'ai à déclarer.`
      );
    }
    if (type === "MIS_EN_CAUSE_LIBRE") {
      return (
        `NOTIFICATIONS DES DROITS (Art. 61-1 CPP) :\n` +
          `Vous êtes entendu(e) librement sur les faits de : ${procedure.qualification}.\n` +
          `Vous avez le droit de quitter les locaux à tout moment, d'être assisté(e) d'un avocat, et de garder le silence.\n\n` +
          `QUESTION : Comprenez-vous ces droits ? Souhaitez-vous faire des déclarations ?\n` +
          `RÉPONSE : J'ai bien compris mes droits. J'accepte de répondre aux questions sans l'assistance d'un avocat.\n\n` +
          `QUESTION : Reconnaissez-vous avoir commis les faits qui vous sont reprochés ?\n` +
          `RÉPONSE : \n\n` +
          `QUESTION : Quelles explications souhaitez-vous apporter ?\n` +
          `RÉPONSE : `
      );
    }
    return (
      `NOTIFICATIONS DES DROITS EN GARDE À VUE (Art. 63-1 CPP) :\n` +
        `QUESTION : Vous êtes placé(e) sous le régime de la Garde à Vue. Reconnaissez-vous les faits de ${procedure.qualification} ?\n` +
        `RÉPONSE : `
    );
  };

  const [declarations, setDeclarations] = useState(defaultTextForType(typeAudition));

  // Date et lieu
  const [lieuAudition, setLieuAudition] = useState(`Dans les locaux de la ${me.unite.nom}`);
  const [savedAudition, setSavedAudition] = useState<Audition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleTypeChange(newType: TypeAudition) {
    setTypeAudition(newType);
    setPlainteDeposee(newType === "VICTIME_PLAINTE");
    setDeclarations(defaultTextForType(newType));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const year = new Date().getFullYear();
    const count = (procedure.auditions?.length || 0) + 1;
    const numeroPV = `${procedure.numeroPV}-AUD-${count}`;
    const now = nowLocal();

    const newAudition: Audition = {
      id: uid(),
      numeroPV,
      typeAudition,
      dateDebut: now,
      dateFin: now,
      lieu: lieuAudition,
      cadreLegal,
      nom: nom.toUpperCase(),
      nomUsage: nomUsage ? nomUsage.toUpperCase() : undefined,
      prenom,
      dateNaissance,
      lieuNaissance,
      nationalite,
      profession,
      domicile,
      telephone,
      email,
      droitsNotifies,
      avocatDemande,
      avocatNom: avocatDemande ? avocatNom : undefined,
      interprete,
      plainteDeposee,
      prejudiceChiffre: prejudiceChiffre ? parseFloat(prejudiceChiffre) : undefined,
      declarations,
      enqueteurId: me.agent.id,
      enqueteurNom: `${me.agent.prenom} ${me.agent.nom.toUpperCase()}`,
      enqueteurGrade: GRADE_ABBR[me.agent.grade],
      enqueteurQualif: QUALIF_LABEL[me.agent.qualification],
      procedureId: procedure.id,
      createdAt: now,
    };

    // 1. Mise à jour du store réactif
    dispatch({
      type: "PROCEDURE_ADD_AUDITION",
      audition: newAudition,
    });

    // 2. Persistance dans la base Supabase PostgreSQL
    try {
      await fetch("/api/auditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAudition),
      });
    } catch (err) {
      console.warn("Échec persistance Supabase audition :", err);
    }

    setSavedAudition(newAudition);
    setViewMode("pv");
    setIsSubmitting(false);

    if (onSaved) onSaved(newAudition);
  }

  const currentAuditionForPv = savedAudition || {
    id: "preview",
    numeroPV: `${procedure.numeroPV}-AUD-1`,
    typeAudition,
    dateDebut: nowLocal(),
    dateFin: nowLocal(),
    lieu: lieuAudition,
    cadreLegal,
    nom: nom.toUpperCase() || "DUPONT",
    nomUsage,
    prenom: prenom || "Jean",
    dateNaissance,
    lieuNaissance,
    nationalite,
    profession,
    domicile,
    telephone,
    email,
    droitsNotifies,
    avocatDemande,
    avocatNom,
    interprete,
    plainteDeposee,
    prejudiceChiffre: prejudiceChiffre ? parseFloat(prejudiceChiffre) : undefined,
    declarations,
    enqueteurId: me.agent.id,
    enqueteurNom: `${me.agent.prenom} ${me.agent.nom.toUpperCase()}`,
    enqueteurGrade: GRADE_ABBR[me.agent.grade],
    enqueteurQualif: QUALIF_LABEL[me.agent.qualification],
    procedureId: procedure.id,
    createdAt: nowLocal(),
  };

  return (
    <Modal
      title={
        viewMode === "form"
          ? `Rédaction du Procès-Verbal d'Audition — Dossier ${procedure.numeroPV}`
          : `Procès-Verbal officiel d'audition — ${currentAuditionForPv.numeroPV}`
      }
      open={open}
      onClose={onClose}
    >
      <div className="space-y-6">
        {/* Barre d'onglet et de contrôle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode("form")}
              className={`px-3 py-1.5 text-xs font-bold rounded ${
                viewMode === "form" ? "bg-gend-900 text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
              }`}
            >
              1. Saisie de la déposition / Audition
            </button>
            <button
              type="button"
              onClick={() => setViewMode("pv")}
              className={`px-3 py-1.5 text-xs font-bold rounded ${
                viewMode === "pv" ? "bg-gend-900 text-white" : "bg-gray-100 text-ink hover:bg-gray-200"
              }`}
            >
              2. Rendu officiel du Procès-Verbal (Format PV)
            </button>
          </div>

          {viewMode === "pv" && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
            >
              Imprimer le Procès-Verbal
            </Button>
          )}
        </div>

        {/* ============================================================== */}
        {/* MODE 1 : FORMULAIRE DE SAISIE GUIDÉ CONFORME CPP               */}
        {/* ============================================================== */}
        {viewMode === "form" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type et cadre légal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded border border-line bg-gray-50 p-4">
              <Field label="Statut de la personne auditionnée" required>
                <select
                  className={inputCls}
                  value={typeAudition}
                  onChange={(e) => handleTypeChange(e.target.value as TypeAudition)}
                >
                  <option value="VICTIME_PLAINTE">
                    Audition de victime / Déposition de plainte (Art. 15-3 CPP)
                  </option>
                  <option value="TEMOIN">Audition libre de témoin (Art. 62 CPP)</option>
                  <option value="MIS_EN_CAUSE_LIBRE">
                    Audition libre de suspect (Art. 61-1 CPP)
                  </option>
                  <option value="GARDE_A_VUE">
                    Audition sous le régime de la Garde à Vue (Art. 63-1 CPP)
                  </option>
                </select>
              </Field>

              <Field label="Cadre juridique de l'enquête" required>
                <select
                  className={inputCls}
                  value={cadreLegal}
                  onChange={(e) => setCadreLegal(e.target.value as TypeDossier)}
                >
                  {Object.entries(TYPE_DOSSIER).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* État civil complet du comparant */}
            <div className="space-y-3 rounded border border-line bg-white p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gend-900 border-b border-line pb-2">
                <User size={15} /> État civil et identité du comparant
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Nom de naissance" required>
                  <input
                    type="text"
                    required
                    placeholder="DUPONT"
                    className={inputCls}
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                  />
                </Field>
                <Field label="Nom d'usage (facultatif)">
                  <input
                    type="text"
                    placeholder="MARTIN"
                    className={inputCls}
                    value={nomUsage}
                    onChange={(e) => setNomUsage(e.target.value)}
                  />
                </Field>
                <Field label="Prénom(s)" required>
                  <input
                    type="text"
                    required
                    placeholder="Jean-Marc"
                    className={inputCls}
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Date de naissance">
                  <input
                    type="date"
                    className={inputCls}
                    value={dateNaissance}
                    onChange={(e) => setDateNaissance(e.target.value)}
                  />
                </Field>
                <Field label="Lieu de naissance">
                  <input
                    type="text"
                    placeholder="Valmont-sur-Loire (45)"
                    className={inputCls}
                    value={lieuNaissance}
                    onChange={(e) => setLieuNaissance(e.target.value)}
                  />
                </Field>
                <Field label="Nationalité">
                  <input
                    type="text"
                    className={inputCls}
                    value={nationalite}
                    onChange={(e) => setNationalite(e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Profession / Activité">
                  <input
                    type="text"
                    placeholder="Commerçant, Technicien..."
                    className={inputCls}
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                  />
                </Field>
                <Field label="Téléphone">
                  <input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className={inputCls}
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    placeholder="jean.dupont@orange.fr"
                    className={inputCls}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Adresse du domicile complet" required>
                <input
                  type="text"
                  required
                  placeholder="12 rue des Acacias, 45120 Valmont-sur-Loire"
                  className={inputCls}
                  value={domicile}
                  onChange={(e) => setDomicile(e.target.value)}
                />
              </Field>
            </div>

            {/* Droits & Formalités légales (selon le type d'audition) */}
            <div className="rounded border border-line bg-blue-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gend-900 border-b border-blue-200 pb-2">
                <Scale size={15} /> Formalités préalables & Droits notifiés
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={droitsNotifies}
                    onChange={(e) => setDroitsNotifies(e.target.checked)}
                    className="mt-1 accent-gend-900"
                  />
                  <span>
                    <strong>Droits légaux dûment notifiés :</strong>
                    <span className="block text-xs text-ink-soft">
                      {typeAudition === "VICTIME_PLAINTE"
                        ? "Information sur les droits des victimes (Art. 10-2 CPP : aide aux victimes, avocat, indemnisation SARVI/CIVI)."
                        : typeAudition === "MIS_EN_CAUSE_LIBRE"
                        ? "Notification des droits du suspect libre (Art. 61-1 CPP : droit de quitter les locaux, silence, avocat)."
                        : "Notification du statut de témoin sans serment / avec serment."}
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interprete}
                    onChange={(e) => setInterprete(e.target.checked)}
                    className="mt-1 accent-gend-900"
                  />
                  <span>
                    <strong>Assistance d&apos;un interprète :</strong>
                    <span className="block text-xs text-ink-soft">
                      La personne comprend et s&apos;exprime couramment en langue française (ou interprète requis).
                    </span>
                  </span>
                </label>

                {(typeAudition === "MIS_EN_CAUSE_LIBRE" || typeAudition === "GARDE_A_VUE") && (
                  <div className="col-span-full border-t border-blue-200 pt-3 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={avocatDemande}
                        onChange={(e) => setAvocatDemande(e.target.checked)}
                        className="accent-gend-900"
                      />
                      <span className="font-semibold text-gend-900">
                        La personne demande l&apos;assistance d&apos;un avocat
                      </span>
                    </label>
                    {avocatDemande && (
                      <input
                        type="text"
                        placeholder="Nom de l'avocat choisi ou avocat commis d'office"
                        className={inputCls}
                        value={avocatNom}
                        onChange={(e) => setAvocatNom(e.target.value)}
                      />
                    )}
                  </div>
                )}

                {typeAudition === "VICTIME_PLAINTE" && (
                  <div className="col-span-full border-t border-blue-200 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plainteDeposee}
                        onChange={(e) => setPlainteDeposee(e.target.checked)}
                        className="accent-gend-900"
                      />
                      <span className="font-semibold text-gend-900">
                        Déclare déposer plainte formellement (constitution de partie civile)
                      </span>
                    </label>
                    <div>
                      <input
                        type="number"
                        placeholder="Montant chiffré du préjudice en €"
                        className={inputCls}
                        value={prejudiceChiffre}
                        onChange={(e) => setPrejudiceChiffre(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Corps de l'audition (Questions / Réponses) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-gend-900 flex items-center gap-2">
                  <FileText size={16} /> Déclarations recueillies (Procès-Verbal d&apos;audition)
                </label>
                <span className="text-xs text-ink-soft">
                  Format standard Gendarmerie : Questions / Réponses
                </span>
              </div>
              <textarea
                rows={12}
                required
                className={`${inputCls} font-mono text-xs leading-relaxed`}
                value={declarations}
                onChange={(e) => setDeclarations(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-line">
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} icon={<FileCheck2 size={16} />}>
                {isSubmitting ? "Enregistrement..." : "Signer et enregistrer l'audition au dossier"}
              </Button>
            </div>
          </form>
        )}

        {/* ============================================================== */}
        {/* MODE 2 : RENDU OFFICIEL DU PROCÈS-VERBAL (IMPRESSION DSFR)     */}
        {/* ============================================================== */}
        {viewMode === "pv" && (
          <div className="border border-line bg-white p-8 font-serif text-ink text-sm leading-relaxed shadow-sm printable-pv">
            {/* En-tête officiel Gendarmerie */}
            <div className="border-b-2 border-gend-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <p className="font-bold uppercase tracking-widest text-xs text-gend-900">
                  RÉPUBLIQUE FRANÇAISE
                </p>
                <p className="text-xs font-semibold text-ink-soft uppercase">
                  MINISTÈRE DE L&apos;INTÉRIEUR
                </p>
                <p className="font-bold text-sm text-gend-900 mt-1">GENDARMERIE NATIONALE</p>
                <p className="text-xs text-ink-soft">{me.unite.nom}</p>
                <p className="text-xs text-ink-mute">Code Unité : {me.unite.code}</p>
              </div>

              <div className="text-right">
                <p className="font-mono font-bold text-sm text-gend-900">
                  PV N° {currentAuditionForPv.numeroPV}
                </p>
                <p className="text-xs text-ink-soft font-semibold">
                  Cadre : {TYPE_DOSSIER[currentAuditionForPv.cadreLegal]}
                </p>
                <p className="text-xs text-ink-soft">
                  Dossier : <span className="font-mono font-bold">{procedure.numeroPV}</span>
                </p>
                <p className="text-xs text-ink-soft">
                  Infraction : <strong>{procedure.qualification}</strong>
                </p>
              </div>
            </div>

            {/* Titre solennel du PV */}
            <div className="text-center my-6">
              <h2 className="text-base font-bold uppercase tracking-wider text-gend-900">
                PROCÈS-VERBAL D&apos;AUDITION
              </h2>
              <p className="text-xs italic text-ink-soft mt-1">
                {TYPE_AUDITION[currentAuditionForPv.typeAudition].label}
              </p>
            </div>

            {/* Formule d'ouverture légale */}
            <div className="space-y-4 text-justify text-xs leading-relaxed">
              <p>
                L&apos;an deux mille vingt-six, le{" "}
                <strong>{new Date(currentAuditionForPv.dateDebut).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</strong>, à{" "}
                <strong>{new Date(currentAuditionForPv.dateDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</strong>,
              </p>

              <p>
                Nous soussigné(e), <strong>{currentAuditionForPv.enqueteurGrade} {currentAuditionForPv.enqueteurNom}</strong>,{" "}
                qualité : <strong>{currentAuditionForPv.enqueteurQualif}</strong>, en résidence à la {me.unite.nom},
              </p>

              <p>
                Agissant en conformité des dispositions du Code de procédure pénale, nous trouvant en nos bureaux,
              </p>

              <p>
                Rapportons les opérations suivantes que nous avons effectuées :
              </p>

              <p>
                Comparait la personne ci-après dénommée :
              </p>

              {/* État civil solennel */}
              <div className="border border-line bg-gray-50/60 p-4 rounded text-xs space-y-1 my-3">
                <p>
                  <strong>Nom :</strong> {currentAuditionForPv.nom} {currentAuditionForPv.nomUsage ? `(Usage : ${currentAuditionForPv.nomUsage})` : ""}
                </p>
                <p>
                  <strong>Prénom(s) :</strong> {currentAuditionForPv.prenom}
                </p>
                <p>
                  <strong>Né(e) le :</strong> {currentAuditionForPv.dateNaissance || "Non précisé"} à {currentAuditionForPv.lieuNaissance || "Non précisé"}
                </p>
                <p>
                  <strong>Nationalité :</strong> {currentAuditionForPv.nationalite} · <strong>Profession :</strong> {currentAuditionForPv.profession || "Sans"}
                </p>
                <p>
                  <strong>Domicile :</strong> {currentAuditionForPv.domicile}
                </p>
                <p>
                  <strong>Téléphone :</strong> {currentAuditionForPv.telephone || "Non précisé"} · <strong>Email :</strong> {currentAuditionForPv.email || "Non précisé"}
                </p>
              </div>

              {/* Mentions légales & notifications */}
              <p className="italic">
                {currentAuditionForPv.typeAudition === "VICTIME_PLAINTE" ? (
                  <>
                    Informons la personne des droits reconnus aux victimes d&apos;infractions pénales en application de l&apos;article 10-2 du Code de procédure pénale (droit à l&apos;assistance d&apos;un avocat, indemnisation de son préjudice, recours aux associations d&apos;aide aux victimes).
                  </>
                ) : currentAuditionForPv.typeAudition === "MIS_EN_CAUSE_LIBRE" ? (
                  <>
                    Faisons notification à l&apos;intéressé(e) des droits prévus par l&apos;article 61-1 du Code de procédure pénale (nature de l&apos;infraction, droit de quitter les locaux à tout moment, droit à l&apos;assistance d&apos;un avocat, droit de faire des déclarations ou de garder le silence).
                  </>
                ) : (
                  <>
                    Prêtons serment ou prenons déposition conformément aux règles applicables du Code de procédure pénale.
                  </>
                )}
              </p>

              {/* Corps de la déposition */}
              <div className="border-t border-b border-line py-4 my-4 font-mono text-xs whitespace-pre-line bg-gray-50/40 p-3 leading-relaxed">
                {currentAuditionForPv.declarations}
              </div>

              {currentAuditionForPv.plainteDeposee && (
                <p className="font-bold">
                  La victime déclare formellement déposer plainte et solliciter la réparation de son préjudice{currentAuditionForPv.prejudiceChiffre ? ` évalué à la somme de ${currentAuditionForPv.prejudiceChiffre} €` : ""}.
                </p>
              )}

              {/* Formule de clôture solennelle */}
              <p className="mt-4">
                Lecture faite par nous-même de la présente déclaration, la personne entendue persiste et signe avec nous le présent procès-verbal.
              </p>
            </div>

            {/* Emplacements de signature réglementaires */}
            <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-line text-xs">
              <div className="text-center">
                <p className="font-bold uppercase">La personne entendue</p>
                <p className="text-ink-mute text-[10px] mt-1">(Mention manuscrite & signature)</p>
                <div className="h-20 border border-dashed border-line mt-3 flex items-center justify-center text-ink-mute italic">
                  [Signature de {currentAuditionForPv.prenom} {currentAuditionForPv.nom}]
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold uppercase">L&apos;enquêteur</p>
                <p className="text-ink-mute text-[10px] mt-1">
                  {currentAuditionForPv.enqueteurGrade} {currentAuditionForPv.enqueteurNom} ({currentAuditionForPv.enqueteurQualif})
                </p>
                <div className="h-20 border border-dashed border-line mt-3 flex items-center justify-center text-ink-mute italic">
                  [Cachet de l&apos;unité et Signature OPJ/APJ]
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
