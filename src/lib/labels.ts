import type {
  EtapeCandidature,
  Grade,
  HabilitationStatut,
  HabilitationType,
  OffreType,
  ProcedureStatut,
  QualifJudiciaire,
  Role,
  StatutActivite,
  StatutPrePlainte,
  Tone,
  TypeAudition,
  TypeDossier,
  TypeInfractionPrePlainte,
  TypeUnite,
} from "./types";

export const GRADE_LABEL: Record<Grade, string> = {
  GAV: "Gendarme adjoint volontaire",
  GENDARME: "Gendarme",
  MDL_CHEF: "Maréchal des logis-chef",
  ADJUDANT: "Adjudant",
  ADJUDANT_CHEF: "Adjudant-chef",
  MAJOR: "Major",
  LIEUTENANT: "Lieutenant",
  CAPITAINE: "Capitaine",
  COMMANDANT: "Commandant",
  LIEUTENANT_COLONEL: "Lieutenant-colonel",
  COLONEL: "Colonel",
};

export const GRADE_ABBR: Record<Grade, string> = {
  GAV: "GAV",
  GENDARME: "GND",
  MDL_CHEF: "MDC",
  ADJUDANT: "ADJ",
  ADJUDANT_CHEF: "ADC",
  MAJOR: "MAJ",
  LIEUTENANT: "LTN",
  CAPITAINE: "CNE",
  COMMANDANT: "CDT",
  LIEUTENANT_COLONEL: "LCL",
  COLONEL: "COL",
};

export const ROLE_LABEL: Record<Role, string> = {
  VISITEUR: "Visiteur",
  AGENT: "Agent",
  OFFICIER: "Gradé / OPJ",
  ADMIN: "Administrateur RH / DSI",
};

export const UNITE_TYPE_LABEL: Record<TypeUnite, string> = {
  BRIGADE: "Brigade territoriale",
  BR: "Brigade de recherches",
  PSIG: "PSIG",
  GROUPEMENT: "Groupement",
};

export const QUALIF_LABEL: Record<QualifJudiciaire, string> = {
  AUCUNE: "—",
  APJ21: "APJA (art. 21)",
  APJ20: "APJ (art. 20)",
  OPJ: "OPJ",
};

type Labeled = { label: string; tone: Tone };

export const STATUT_AGENT: Record<StatutActivite, Labeled> = {
  ACTIF: { label: "Actif", tone: "success" },
  EN_CONGE: { label: "En congé", tone: "info" },
  DETACHE: { label: "Détaché", tone: "navy" },
  SUSPENDU: { label: "Suspendu", tone: "warning" },
  RADIE: { label: "Révoqué", tone: "error" },
};

export const STATUT_PROCEDURE: Record<ProcedureStatut, Labeled> = {
  OUVERTE: { label: "Ouverte", tone: "info" },
  TRANSMISE_PARQUET: { label: "Transmise au parquet", tone: "success" },
  CLASSEE: { label: "Classée", tone: "neutral" },
};

export const TYPE_DOSSIER: Record<TypeDossier, string> = {
  FLAGRANT_DELIT: "Flagrant délit",
  ENQUETE_PRELIMINAIRE: "Enquête préliminaire",
  INTERVENTION: "Fiche d'intervention",
  COMMISSION_ROGATOIRE: "Commission rogatoire",
};

export const HABILITATION_TYPE: Record<HabilitationType, string> = {
  ACCES_PORTAIL: "Demande de compte d'accès (Agent en service)",
  FICHIERS_CONFIDENTIELS: "Accès fichiers confidentiels",
  ARMURERIE: "Accès armurerie",
  OPJ: "Habilitation OPJ",
  APJ: "Habilitation APJ",
};

export const STATUT_HABILITATION: Record<HabilitationStatut, Labeled> = {
  EN_ATTENTE: { label: "En attente", tone: "warning" },
  VALIDEE: { label: "Validé", tone: "success" },
  REJETEE: { label: "Rejeté", tone: "error" },
};

export const OFFRE_LABEL: Record<OffreType, string> = {
  GAV: "Gendarme adjoint volontaire",
  SOUS_OFFICIER: "Sous-officier",
  OFFICIER: "Officier",
};

export const ETAPES_CANDIDATURE: EtapeCandidature[] = ["DOSSIER_RECU", "EPREUVES", "VISITE_MEDICALE", "RETENU"];

export const ETAPE_CANDIDATURE: Record<EtapeCandidature, Labeled> = {
  DOSSIER_RECU: { label: "Dossier reçu", tone: "neutral" },
  EPREUVES: { label: "Épreuves", tone: "info" },
  VISITE_MEDICALE: { label: "Visite médicale", tone: "warning" },
  RETENU: { label: "Retenu", tone: "success" },
  NON_RETENU: { label: "Non retenu", tone: "error" },
};

export const TYPE_INFRACTION_PRE_PLAINTE: Record<TypeInfractionPrePlainte, string> = {
  VOL_SIMPLE: "Vol simple (sans effraction)",
  VOL_EFFRACTION: "Vol avec effraction / Cambriolage",
  VOL_VEHICULE: "Vol de véhicule ou à la roulotte",
  DEGRADATION_BIEN: "Dégradation ou vandalisme de bien privé",
  ESCROQUERIE: "Escroquerie / Filouterie",
  ABUS_CONFIANCE: "Abus de confiance",
  AUTRE_ATTEINTE_BIENS: "Autre atteinte aux biens",
};

export const STATUT_PRE_PLAINTE: Record<StatutPrePlainte, Labeled> = {
  DEPOSEE: { label: "Déposée en ligne", tone: "warning" },
  PRISE_EN_CHARGE: { label: "Prise en charge par l'unité", tone: "info" },
  CONVOQUEE: { label: "Rendez-vous fixé", tone: "navy" },
  TRANSFORMEE_EN_PV: { label: "Procès-verbal signé (Audition)", tone: "success" },
  CLASSEE_SANS_SUITE: { label: "Non éligible / Classée", tone: "neutral" },
};

export const TYPE_AUDITION: Record<TypeAudition, Labeled> = {
  VICTIME_PLAINTE: { label: "Audition de victime / Déposition de plainte (Art. 15-3 CPP)", tone: "info" },
  TEMOIN: { label: "Audition de témoin (Art. 62 CPP)", tone: "neutral" },
  MIS_EN_CAUSE_LIBRE: { label: "Audition libre de suspect (Art. 61-1 CPP)", tone: "warning" },
  GARDE_A_VUE: { label: "Audition sous Garde à Vue (Art. 63-1 CPP)", tone: "error" },
};


