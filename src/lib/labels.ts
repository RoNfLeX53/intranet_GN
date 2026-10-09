import type {
  EtapeCandidature,
  Grade,
  HabilitationStatut,
  HabilitationType,
  Institution,
  OffreType,
  ProcedureStatut,
  QualifJudiciaire,
  Role,
  StatutActivite,
  StatutDemandeAcces,
  StatutPrePlainte,
  Tone,
  TypeAudition,
  TypeDossier,
  TypeInfractionPrePlainte,
  TypeUnite,
} from "./types";

export const INSTITUTION_LABEL: Record<Institution, string> = {
  GENDARMERIE: "Gendarmerie nationale",
  POLICE_NATIONALE: "Police nationale",
  JUSTICE: "Justice & Juridictions (Tribunal, Parquet, Barreau)",
};

export const GRADE_LABEL: Record<Grade, string> = {
  // Gendarmerie
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
  // Police Nationale - Corps d'application et d'encadrement
  POLICIER_ADJOINT: "Policier adjoint",
  GARDIEN_DE_LA_PAIX: "Gardien de la paix",
  BRIGADIER_CHEF_POLICE: "Brigadier-chef de police",
  MAJOR_POLICE: "Major de police",
  MAJOR_RULP: "Major RULP (Responsable d'unité locale)",
  // Police Nationale - Corps de commandement
  CAPITAINE_POLICE: "Capitaine de police",
  COMMANDANT_POLICE: "Commandant de police",
  COMMANDANT_DIVISIONNAIRE: "Commandant divisionnaire",
  COMMANDANT_DIV_EF: "Commandant div. à l'emploi fonctionnel",
  // Police Nationale - Corps de conception et de direction
  COMMISSAIRE_POLICE: "Commissaire de police",
  COMMISSAIRE_DIVISIONNAIRE: "Commissaire divisionnaire",
  COMMISSAIRE_GENERAL: "Commissaire général",
  CONTROLEUR_GENERAL: "Contrôleur général",
  INSPECTEUR_GENERAL: "Inspecteur général",
  DGPN: "Directeur des services actifs / DGPN",
  // Justice & Juridictions
  PROCUREUR: "Procureur de la République",
  PROCUREUR_ADJOINT: "Procureur adjoint",
  SUBSTITUT_PROCUREUR: "Substitut du procureur",
  JUGE_INSTRUCTION: "Juge d'instruction",
  JUGE_LIBERTES: "Juge des libertés et de la détention (JLD)",
  JUGE_ENFANTS: "Juge des enfants",
  JUGE_SIEGE: "Juge du siège / Magistrat",
  PRESIDENT_TRIBUNAL: "Président du Tribunal Judiciaire",
  AVOCAT_BARREAU: "Avocat au Barreau (Maître)",
  BATONNIER: "Bâtonnier de l'Ordre des Avocats",
  GREFFIER_TRIBUNAL: "Greffier judiciaire",
};

export const GRADE_ABBR: Record<Grade, string> = {
  // Gendarmerie
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
  // Police Nationale
  POLICIER_ADJOINT: "PA",
  GARDIEN_DE_LA_PAIX: "GPX",
  BRIGADIER_CHEF_POLICE: "BCH",
  MAJOR_POLICE: "MAJ",
  MAJOR_RULP: "RULP",
  CAPITAINE_POLICE: "CPT",
  COMMANDANT_POLICE: "CDT",
  COMMANDANT_DIVISIONNAIRE: "CDTD",
  COMMANDANT_DIV_EF: "CDEF",
  COMMISSAIRE_POLICE: "COMM",
  COMMISSAIRE_DIVISIONNAIRE: "CDIV",
  COMMISSAIRE_GENERAL: "CGEN",
  CONTROLEUR_GENERAL: "CG",
  INSPECTEUR_GENERAL: "IG",
  DGPN: "DGPN",
  // Justice & Juridictions
  PROCUREUR: "PR",
  PROCUREUR_ADJOINT: "PR-ADJ",
  SUBSTITUT_PROCUREUR: "SUB",
  JUGE_INSTRUCTION: "JI",
  JUGE_LIBERTES: "JLD",
  JUGE_ENFANTS: "JE",
  JUGE_SIEGE: "JUG",
  PRESIDENT_TRIBUNAL: "PTJ",
  AVOCAT_BARREAU: "ME",
  BATONNIER: "BAT",
  GREFFIER_TRIBUNAL: "GREFF",
};

export const GRADES_BY_INSTITUTION: Record<Institution, Grade[]> = {
  GENDARMERIE: [
    "GAV",
    "GENDARME",
    "MDL_CHEF",
    "ADJUDANT",
    "ADJUDANT_CHEF",
    "MAJOR",
    "LIEUTENANT",
    "CAPITAINE",
    "COMMANDANT",
    "LIEUTENANT_COLONEL",
    "COLONEL",
  ],
  POLICE_NATIONALE: [
    "POLICIER_ADJOINT",
    "GARDIEN_DE_LA_PAIX",
    "BRIGADIER_CHEF_POLICE",
    "MAJOR_POLICE",
    "MAJOR_RULP",
    "CAPITAINE_POLICE",
    "COMMANDANT_POLICE",
    "COMMANDANT_DIVISIONNAIRE",
    "COMMANDANT_DIV_EF",
    "COMMISSAIRE_POLICE",
    "COMMISSAIRE_DIVISIONNAIRE",
    "COMMISSAIRE_GENERAL",
    "CONTROLEUR_GENERAL",
    "INSPECTEUR_GENERAL",
    "DGPN",
  ],
  JUSTICE: [
    "PROCUREUR",
    "PROCUREUR_ADJOINT",
    "SUBSTITUT_PROCUREUR",
    "JUGE_INSTRUCTION",
    "JUGE_LIBERTES",
    "JUGE_ENFANTS",
    "JUGE_SIEGE",
    "PRESIDENT_TRIBUNAL",
    "AVOCAT_BARREAU",
    "BATONNIER",
    "GREFFIER_TRIBUNAL",
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  VISITEUR: "Visiteur",
  AGENT: "Agent",
  OFFICIER: "Gradé / OPJ",
  ADMIN: "Administrateur RH / DSI",
  MAGISTRAT: "Magistrat (Parquet / Siège)",
  AVOCAT: "Avocat au Barreau",
};

export const UNITE_TYPE_LABEL: Record<TypeUnite, string> = {
  BRIGADE: "Brigade territoriale",
  BR: "Brigade de recherches",
  PSIG: "PSIG",
  GROUPEMENT: "Groupement",
  COMMISSARIAT: "Commissariat central (CSP)",
  BAC: "Brigade Anti-Criminalité (BAC)",
  PJ: "Police Judiciaire (DTPJ / SLPJ)",
  CRS: "Compagnie Républicaine de Sécurité (CRS)",
  DIPN: "Direction Interdépartementale (DIPN)",
  TRIBUNAL_JUDICIAIRE: "Tribunal Judiciaire (TJ)",
  PARQUET: "Parquet de la République",
  CABINET_INSTRUCTION: "Cabinet d'instruction",
  BARREAU_AVOCATS: "Ordre des Avocats / Barreau",
};

export const STATUT_DEMANDE_ACCES: Record<StatutDemandeAcces, Labeled> = {
  EN_ATTENTE: { label: "En attente de validation RH", tone: "warning" },
  VALIDEE: { label: "Compte activé (Validée)", tone: "success" },
  REJETEE: { label: "Demande refusée", tone: "error" },
};

export const QUALIF_LABEL: Record<QualifJudiciaire, string> = {
  AUCUNE: "—",
  APJ21: "APJA (art. 21)",
  APJ20: "APJ (art. 20)",
  OPJ: "OPJ",
  MAGISTRAT: "Magistrat",
  AVOCAT: "Avocat",
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


