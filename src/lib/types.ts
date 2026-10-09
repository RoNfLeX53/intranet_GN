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
  dateIncorporation: string;
  revocation?: { date: string; motif: string; par: string };
}

export interface HistoriqueEntry {
  date: string;
  acteurId: string;
  action: string;
  commentaire?: string;
}

export type HabilitationType = "FICHIERS_CONFIDENTIELS" | "ARMURERIE" | "OPJ" | "APJ";
export type HabilitationStatut = "EN_ATTENTE" | "VALIDEE" | "REJETEE";

export interface DemandeHabilitation {
  id: string;
  reference: string;
  demandeurId: string;
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
