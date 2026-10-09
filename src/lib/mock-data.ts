// Configuration & Données initiales du portail Sentinelle
import type { Agent, AuthRole, Candidature, DemandeHabilitation, Offre, Procedure, Unite } from "./types";
import { chainAudit } from "./utils";

export const UNITES: Unite[] = [
  { id: "u1", code: "4512", nom: "BTA de Valmont-sur-Loire", type: "BRIGADE" },
  { id: "u2", code: "4530", nom: "Brigade de recherches de Valmont", type: "BR" },
  { id: "u3", code: "4540", nom: "PSIG de Valmont", type: "PSIG" },
  { id: "u4", code: "4500", nom: "État-major du groupement", type: "GROUPEMENT" },
];

/**
 * Seul le compte Administrateur RH / SI initial est conservé pour l'amorçage.
 * Tous les agents en service et candidats créeront leurs accès ou seront incorporés via l'intranet.
 */
export const AGENTS: Agent[] = [
  {
    id: "admin-1",
    matricule: "176540",
    identifiant: "admin",
    motDePasse: "Admin2026!",
    nom: "Lambert",
    prenom: "Sophie",
    grade: "COMMANDANT",
    uniteId: "u4",
    affectation: "Cheffe du bureau RH / SI",
    statut: "ACTIF",
    qualification: "OPJ",
    role: "ADMIN",
    email: "s.lambert@gendarmerie.interieur.gouv.fr",
    dateIncorporation: "2015-09-01",
  },
];

export const DEMO_ACCOUNTS: Record<AuthRole, string> = {
  AGENT: "admin-1",
  OFFICIER: "admin-1",
  ADMIN: "admin-1",
};

/** Procédures judiciaires : base vierge prête pour les enregistrements réels */
export const PROCEDURES: Procedure[] = [];

/** Demandes d'habilitations : base vierge */
export const HABILITATIONS: DemandeHabilitation[] = [];

/** Offres de recrutement publiques officielles */
export const OFFRES: Offre[] = [
  {
    type: "GAV",
    titre: "Gendarme adjoint volontaire (GAV)",
    accroche: "Premier engagement au contact des citoyens aux côtés des sous-officiers et officiers de gendarmerie.",
    conditions: ["Nationalité française", "17 à 26 ans au dépôt de dossier", "Sans condition de diplôme", "Aptitude médicale"],
    duree: "Contrat de 2 à 5 ans",
  },
  {
    type: "SOUS_OFFICIER",
    titre: "Sous-officier de gendarmerie (SOG)",
    accroche: "Le cœur opérationnel : sécurité publique générale, police judiciaire, peloton de surveillance et d'intervention.",
    conditions: ["Nationalité française", "Titulaire du Baccalauréat", "Concours national (épreuves écrites, sport, oral)", "Formation en école de 12 mois"],
    duree: "Carrière militaire",
  },
  {
    type: "OFFICIER",
    titre: "Officier de gendarmerie (OG)",
    accroche: "Commander et décider au sein des compagnies, escadrons et groupements de gendarmerie.",
    conditions: ["Nationalité française", "Diplôme de niveau Master 2 ou titre d'ingénieur", "Concours d'officier", "École des officiers de la Gendarmerie (EOGN)"],
    duree: "Carrière militaire",
  },
];

/** Candidatures citoyennes reçues via l'espace public (débute vierge) */
export const CANDIDATURES: Candidature[] = [];

/** Journal d'audit initial */
export const AUDIT = chainAudit([
  {
    id: "l0",
    date: "2026-10-09T08:00:00",
    acteur: "CDT LAMBERT (admin)",
    role: "ADMIN",
    action: "INITIALISATION_PORTAIL",
    cible: "Ouverture officielle du portail Sentinelle",
    ip: "10.45.0.1",
  },
]);
