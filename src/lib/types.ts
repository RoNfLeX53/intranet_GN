// Types métier partagés par la maquette (miroir simplifié du schéma Prisma).

export type Role = "VISITEUR" | "AGENT" | "OFFICIER" | "ADMIN";
export type AuthRole = Exclude<Role, "VISITEUR">;
export type Tone = "neutral" | "info" | "success" | "warning" | "error" | "navy";

export type Grade =
  | "GAV"
  | "GENDARME"
  | "MDL_CHEF"
  | "ADJUDANT"
  | "ADJUDANT_CHEF"
  | "MAJOR"
  | "LIEUTENANT"
  | "CAPITAINE"
  | "COMMANDANT"
  | "LIEUTENANT_COLONEL"
  | "COLONEL";

export type StatutActivite = "ACTIF" | "EN_CONGE" | "DETACHE" | "SUSPENDU" | "RADIE";
export type QualifJudiciaire = "AUCUNE" | "APJ21" | "APJ20" | "OPJ";
export type TypeUnite = "BRIGADE" | "BR" | "PSIG" | "GROUPEMENT";

export interface Unite {
  id: string;
  code: string;
  nom: string;
  type: TypeUnite;
}

export interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  grade: Grade;
  uniteId: string;
  affectation: string;
  statut: StatutActivite;
  qualification: QualifJudiciaire;
  role: AuthRole;
  email: string;
  identifiant?: string; // Nom d'utilisateur ou matricule
  motDePasse?: string;  // Mot de passe transmis à l'agent
  dateIncorporation: string;
  revocation?: { date: string; motif: string; par: string };
}

export interface HistoriqueEntry {
  date: string;
  acteurId: string;
  action: string;
  commentaire?: string;
}

export type HabilitationType = "ACCES_PORTAIL" | "FICHIERS_CONFIDENTIELS" | "ARMURERIE" | "OPJ" | "APJ";
export type HabilitationStatut = "EN_ATTENTE" | "VALIDEE" | "REJETEE";

export interface DemandeHabilitation {
  id: string;
  reference: string;
  demandeurId: string;
  demandeurNom?: string; // Nom de l'agent si non encore authentifié
  demandeurEmail?: string;
  type: HabilitationType;
  motif: string;
  /** 0 = permanente */
  dureeMois: number;
  statut: HabilitationStatut;
  createdAt: string;
  historique: HistoriqueEntry[];
}

export type ProcedureStatut = "OUVERTE" | "TRANSMISE_PARQUET" | "CLASSEE";
export type TypeDossier = "FLAGRANT_DELIT" | "ENQUETE_PRELIMINAIRE" | "INTERVENTION" | "COMMISSION_ROGATOIRE";
export type Classification = "NON_PROTEGE" | "DIFFUSION_RESTREINTE";

export interface Rapport {
  id: string;
  auteurId: string;
  date: string;
  contenu: string;
}

export interface Procedure {
  id: string;
  numeroPV: string;
  dateFaits: string;
  dateOuverture: string;
  redacteurId: string;
  uniteId: string;
  type: TypeDossier;
  qualification: string;
  lieu: string;
  resume: string;
  statut: ProcedureStatut;
  classification: Classification;
  valideParId?: string;
  parquet?: string;
  historique: HistoriqueEntry[];
  rapports: Rapport[];
  auditions?: Audition[];
}

export type TypeAudition = "VICTIME_PLAINTE" | "TEMOIN" | "MIS_EN_CAUSE_LIBRE" | "GARDE_A_VUE";

export interface Audition {
  id: string;
  numeroPV: string;
  typeAudition: TypeAudition;
  dateDebut: string;
  dateFin?: string;
  lieu: string;
  cadreLegal: TypeDossier;

  // Personne entendue
  nom: string;
  nomUsage?: string;
  prenom: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  nationalite: string;
  profession?: string;
  domicile: string;
  telephone?: string;
  email?: string;

  // Droits & formalités
  droitsNotifies: boolean;
  avocatDemande: boolean;
  avocatNom?: string;
  interprete: boolean;
  plainteDeposee: boolean;
  prejudiceChiffre?: number;

  // Corps de l'audition (procès-verbal intégral conforme style officiel)
  declarations: string;

  // Enquêteur
  enqueteurId: string;
  enqueteurNom: string;
  enqueteurGrade: string;
  enqueteurQualif: string;

  procedureId: string;
  createdAt: string;
}

export type OffreType = "GAV" | "SOUS_OFFICIER" | "OFFICIER";
export type EtapeCandidature = "DOSSIER_RECU" | "EPREUVES" | "VISITE_MEDICALE" | "RETENU" | "NON_RETENU";

export interface Offre {
  type: OffreType;
  titre: string;
  accroche: string;
  conditions: string[];
  duree: string;
}

export interface Candidature {
  id: string;
  reference: string;
  offre: OffreType;
  nom: string;
  prenom: string;
  email: string;
  dateNaissance: string;
  niveauEtudes: string;
  etape: EtapeCandidature;
  createdAt: string;
  historique: HistoriqueEntry[];
}

export interface AuditLog {
  id: string;
  date: string;
  acteur: string;
  role: Role;
  action: string;
  cible: string;
  ip: string;
  prevHash: string;
  hash: string;
}

export type StatutPrePlainte =
  | "DEPOSEE"
  | "PRISE_EN_CHARGE"
  | "CONVOQUEE"
  | "TRANSFORMEE_EN_PV"
  | "CLASSEE_SANS_SUITE";

export type TypeInfractionPrePlainte =
  | "VOL_SIMPLE"
  | "VOL_EFFRACTION"
  | "VOL_VEHICULE"
  | "DEGRADATION_BIEN"
  | "ESCROQUERIE"
  | "ABUS_CONFIANCE"
  | "AUTRE_ATTEINTE_BIENS";

export interface PrePlainte {
  id: string;
  numeroDossier: string;
  typeInfraction: TypeInfractionPrePlainte;
  dateFaits: string;
  lieuFaits: string;
  description: string;
  auteurInconnu: boolean;
  prejudiceEstime?: number;
  statut: StatutPrePlainte;
  dateRdv?: string;
  createdAt: string;
  victimeNom: string;
  victimePrenom: string;
  victimeEmail: string;
  victimeTelephone: string;
  victimeAdresse: string;
  uniteId: string;
  agentId?: string;
}

