// Jeu de données ENTIÈREMENT FICTIF (noms, matricules, lieux, numéros de PV).
import type { Agent, AuthRole, Candidature, DemandeHabilitation, Offre, Procedure, Unite } from "./types";
import { chainAudit } from "./utils";

export const UNITES: Unite[] = [
  { id: "u1", code: "4512", nom: "BTA de Valmont-sur-Loire", type: "BRIGADE" },
  { id: "u2", code: "4530", nom: "Brigade de recherches de Valmont", type: "BR" },
  { id: "u3", code: "4540", nom: "PSIG de Valmont", type: "PSIG" },
  { id: "u4", code: "4500", nom: "État-major du groupement (fictif)", type: "GROUPEMENT" },
];

export const AGENTS: Agent[] = [
  { id: "a1", matricule: "198734", nom: "Arnaud", prenom: "Julien", grade: "CAPITAINE", uniteId: "u1", affectation: "Commandant de brigade", statut: "ACTIF", qualification: "OPJ", role: "OFFICIER", email: "j.arnaud@sentinelle.test", dateIncorporation: "2009-09-01" },
  { id: "a2", matricule: "214563", nom: "Benali", prenom: "Karim", grade: "ADJUDANT", uniteId: "u1", affectation: "Adjoint au commandant de brigade", statut: "ACTIF", qualification: "OPJ", role: "OFFICIER", email: "k.benali@sentinelle.test", dateIncorporation: "2011-03-14" },
  { id: "a3", matricule: "245781", nom: "Moreau", prenom: "Léa", grade: "GENDARME", uniteId: "u1", affectation: "Enquêtrice — groupe judiciaire", statut: "ACTIF", qualification: "APJ20", role: "AGENT", email: "l.moreau@sentinelle.test", dateIncorporation: "2019-10-07" },
  { id: "a4", matricule: "231209", nom: "Girard", prenom: "Thomas", grade: "MDL_CHEF", uniteId: "u1", affectation: "Chef de patrouille", statut: "EN_CONGE", qualification: "OPJ", role: "AGENT", email: "t.girard@sentinelle.test", dateIncorporation: "2015-01-05" },
  { id: "a5", matricule: "268114", nom: "Fabre", prenom: "Inès", grade: "GAV", uniteId: "u1", affectation: "Accueil / patrouille", statut: "ACTIF", qualification: "APJ21", role: "AGENT", email: "i.fabre@sentinelle.test", dateIncorporation: "2025-02-03" },
  { id: "a6", matricule: "187652", nom: "Roux", prenom: "Philippe", grade: "MAJOR", uniteId: "u2", affectation: "Chef de groupe enquêtes", statut: "ACTIF", qualification: "OPJ", role: "OFFICIER", email: "p.roux@sentinelle.test", dateIncorporation: "2002-09-02" },
  { id: "a7", matricule: "252340", nom: "Petit", prenom: "Hugo", grade: "GENDARME", uniteId: "u2", affectation: "Enquêteur", statut: "DETACHE", qualification: "APJ20", role: "AGENT", email: "h.petit@sentinelle.test", dateIncorporation: "2020-06-15" },
  { id: "a8", matricule: "205871", nom: "Haddad", prenom: "Nadia", grade: "ADJUDANT_CHEF", uniteId: "u3", affectation: "Cheffe de patrouille PSIG", statut: "ACTIF", qualification: "OPJ", role: "OFFICIER", email: "n.haddad@sentinelle.test", dateIncorporation: "2007-04-23" },
  { id: "a9", matricule: "176540", nom: "Lambert", prenom: "Sophie", grade: "COMMANDANT", uniteId: "u4", affectation: "Cheffe du bureau RH / SI", statut: "ACTIF", qualification: "AUCUNE", role: "ADMIN", email: "s.lambert@sentinelle.test", dateIncorporation: "2004-09-01" },
  { id: "a10", matricule: "259903", nom: "Leroy", prenom: "Maxime", grade: "GENDARME", uniteId: "u3", affectation: "Équipier PSIG", statut: "SUSPENDU", qualification: "APJ20", role: "AGENT", email: "m.leroy@sentinelle.test", dateIncorporation: "2021-11-02" },
];

/** Comptes de démonstration associés à chaque rôle. */
export const DEMO_ACCOUNTS: Record<AuthRole, string> = {
  AGENT: "a3",
  OFFICIER: "a1",
  ADMIN: "a9",
};

export const PROCEDURES: Procedure[] = [
  {
    id: "p1",
    numeroPV: "4512/00341/2026",
    dateFaits: "2026-09-28T03:40:00",
    dateOuverture: "2026-09-28T07:15:00",
    redacteurId: "a3",
    uniteId: "u1",
    type: "FLAGRANT_DELIT",
    qualification: "Vol avec effraction dans un local d'habitation",
    lieu: "12 rue des Tilleuls, Valmont-sur-Loire",
    resume:
      "Appel du requérant à 03h52 signalant une intrusion à son domicile. Constatations : fenêtre arrière fracturée, désordre dans le séjour. Préjudice déclaré : matériel informatique et bijoux. Relevés de traces papillaires effectués par le TIC. Enquête de voisinage en cours, exploitation de la vidéoprotection municipale sollicitée.",
    statut: "OUVERTE",
    classification: "DIFFUSION_RESTREINTE",
    historique: [
      { date: "2026-09-28T07:15:00", acteurId: "a3", action: "Ouverture de la procédure" },
      { date: "2026-09-28T11:02:00", acteurId: "a3", action: "Rapport ajouté", commentaire: "Procès-verbal de constatations" },
      { date: "2026-09-30T16:20:00", acteurId: "a2", action: "Réquisition émise", commentaire: "Vidéoprotection municipale — secteur centre" },
    ],
    rapports: [
      { id: "r1", auteurId: "a3", date: "2026-09-28T11:02:00", contenu: "PV de constatations : effraction par fenêtre arrière, traces de pesée. Relevés TIC transmis pour exploitation." },
      { id: "r2", auteurId: "a3", date: "2026-10-01T09:30:00", contenu: "Audition d'un témoin (voisin) : véhicule utilitaire clair aperçu vers 03h30. Description partielle de la plaque." },
    ],
  },
  {
    id: "p2",
    numeroPV: "4512/00338/2026",
    dateFaits: "2026-09-20T14:00:00",
    dateOuverture: "2026-09-22T09:00:00",
    redacteurId: "a2",
    uniteId: "u1",
    type: "ENQUETE_PRELIMINAIRE",
    qualification: "Escroquerie en ligne (faux conseiller bancaire)",
    lieu: "Valmont-sur-Loire",
    resume: "Plainte d'une victime ayant validé des opérations après appel d'un faux conseiller. Réquisitions bancaires réalisées, identification d'un compte de rebond.",
    statut: "TRANSMISE_PARQUET",
    classification: "DIFFUSION_RESTREINTE",
    valideParId: "a1",
    parquet: "Parquet du TJ de Valmont",
    historique: [
      { date: "2026-09-22T09:00:00", acteurId: "a2", action: "Ouverture de la procédure" },
      { date: "2026-10-02T17:45:00", acteurId: "a1", action: "Validée et transmise au parquet", commentaire: "Parquet du TJ de Valmont" },
    ],
    rapports: [],
  },
  {
    id: "p3",
    numeroPV: "4512/00335/2026",
    dateFaits: "2026-09-15T21:10:00",
    dateOuverture: "2026-09-15T21:40:00",
    redacteurId: "a4",
    uniteId: "u1",
    type: "INTERVENTION",
    qualification: "Différend familial — intervention sur appel 17",
    lieu: "Hameau des Brosses, Valmont-sur-Loire",
    resume: "Intervention suite à un différend verbal. Situation apaisée à l'arrivée de la patrouille, aucune infraction constatée. Orientation vers l'intervenant social.",
    statut: "CLASSEE",
    classification: "NON_PROTEGE",
    historique: [
      { date: "2026-09-15T21:40:00", acteurId: "a4", action: "Ouverture de la fiche d'intervention" },
      { date: "2026-09-16T08:30:00", acteurId: "a1", action: "Classée", commentaire: "Absence d'infraction constatée" },
    ],
    rapports: [],
  },
  {
    id: "p4",
    numeroPV: "4512/00344/2026",
    dateFaits: "2026-10-03T23:15:00",
    dateOuverture: "2026-10-04T08:00:00",
    redacteurId: "a5",
    uniteId: "u1",
    type: "INTERVENTION",
    qualification: "Dégradation d'un bien d'utilité publique (abribus)",
    lieu: "Avenue de la Gare, Valmont-sur-Loire",
    resume: "Signalement par la mairie d'un abribus vandalisé. Constatations photographiques réalisées.",
    statut: "OUVERTE",
    classification: "NON_PROTEGE",
    historique: [{ date: "2026-10-04T08:00:00", acteurId: "a5", action: "Ouverture de la fiche d'intervention" }],
    rapports: [],
  },
  {
    id: "p5",
    numeroPV: "4530/00112/2026",
    dateFaits: "2026-09-01T00:00:00",
    dateOuverture: "2026-09-30T10:00:00",
    redacteurId: "a6",
    uniteId: "u2",
    type: "COMMISSION_ROGATOIRE",
    qualification: "Trafic de stupéfiants",
    lieu: "Agglomération de Valmont",
    resume: "Exécution d'une commission rogatoire délivrée par le juge d'instruction. Surveillances et exploitation téléphonique en cours.",
    statut: "OUVERTE",
    classification: "DIFFUSION_RESTREINTE",
    historique: [{ date: "2026-09-30T10:00:00", acteurId: "a6", action: "Ouverture de la procédure" }],
    rapports: [],
  },
  {
    id: "p6",
    numeroPV: "4530/00109/2026",
    dateFaits: "2026-08-12T00:00:00",
    dateOuverture: "2026-08-14T09:00:00",
    redacteurId: "a7",
    uniteId: "u2",
    type: "ENQUETE_PRELIMINAIRE",
    qualification: "Recel de véhicules volés",
    lieu: "Zone artisanale Nord, Valmont",
    resume: "Découverte de trois véhicules faussement immatriculés dans un entrepôt.",
    statut: "TRANSMISE_PARQUET",
    classification: "DIFFUSION_RESTREINTE",
    valideParId: "a6",
    parquet: "Parquet du TJ de Valmont",
    historique: [
      { date: "2026-08-14T09:00:00", acteurId: "a7", action: "Ouverture de la procédure" },
      { date: "2026-09-25T15:00:00", acteurId: "a6", action: "Validée et transmise au parquet" },
    ],
    rapports: [],
  },
  {
    id: "p7",
    numeroPV: "4540/00057/2026",
    dateFaits: "2026-10-05T01:20:00",
    dateOuverture: "2026-10-05T01:45:00",
    redacteurId: "a8",
    uniteId: "u3",
    type: "FLAGRANT_DELIT",
    qualification: "Conduite sous l'empire d'un état alcoolique et refus d'obtempérer",
    lieu: "RD 951, Valmont",
    resume: "Véhicule refusant de s'arrêter lors d'un contrôle. Interpellation après une courte poursuite, dépistage positif.",
    statut: "TRANSMISE_PARQUET",
    classification: "NON_PROTEGE",
    valideParId: "a8",
    parquet: "Parquet du TJ de Valmont",
    historique: [
      { date: "2026-10-05T01:45:00", acteurId: "a8", action: "Ouverture de la procédure" },
      { date: "2026-10-05T09:10:00", acteurId: "a8", action: "Validée et transmise au parquet" },
    ],
    rapports: [],
  },
  {
    id: "p8",
    numeroPV: "4512/00346/2026",
    dateFaits: "2026-10-01T00:00:00",
    dateOuverture: "2026-10-06T10:30:00",
    redacteurId: "a3",
    uniteId: "u1",
    type: "ENQUETE_PRELIMINAIRE",
    qualification: "Usurpation d'identité",
    lieu: "Valmont-sur-Loire",
    resume: "Plainte pour ouverture de lignes téléphoniques au nom de la victime à son insu.",
    statut: "OUVERTE",
    classification: "DIFFUSION_RESTREINTE",
    historique: [{ date: "2026-10-06T10:30:00", acteurId: "a3", action: "Ouverture de la procédure" }],
    rapports: [],
  },
];

export const HABILITATIONS: DemandeHabilitation[] = [
  {
    id: "h1", reference: "HAB-2026-0141", demandeurId: "a3", type: "FICHIERS_CONFIDENTIELS",
    motif: "Consultation du fichier des personnes recherchées dans le cadre de la procédure 4512/00341/2026.",
    dureeMois: 6, statut: "EN_ATTENTE", createdAt: "2026-10-01T10:12:00",
    historique: [{ date: "2026-10-01T10:12:00", acteurId: "a3", action: "Demande déposée" }],
  },
  {
    id: "h2", reference: "HAB-2026-0138", demandeurId: "a5", type: "ARMURERIE",
    motif: "Perception de l'arme de dotation après validation de la formation initiale au tir.",
    dureeMois: 12, statut: "EN_ATTENTE", createdAt: "2026-09-29T08:40:00",
    historique: [{ date: "2026-09-29T08:40:00", acteurId: "a5", action: "Demande déposée" }],
  },
  {
    id: "h3", reference: "HAB-2026-0130", demandeurId: "a4", type: "OPJ",
    motif: "Examen OPJ réussi — session 2026. Demande d'habilitation auprès du procureur général.",
    dureeMois: 0, statut: "VALIDEE", createdAt: "2026-09-10T14:00:00",
    historique: [
      { date: "2026-09-10T14:00:00", acteurId: "a4", action: "Demande déposée" },
      { date: "2026-09-12T09:00:00", acteurId: "a1", action: "Avis favorable du commandant d'unité" },
      { date: "2026-09-20T11:30:00", acteurId: "a9", action: "Validée", commentaire: "Arrêté d'habilitation reçu" },
    ],
  },
  {
    id: "h4", reference: "HAB-2026-0127", demandeurId: "a7", type: "FICHIERS_CONFIDENTIELS",
    motif: "Accès étendu aux fichiers d'antécédents.",
    dureeMois: 12, statut: "REJETEE", createdAt: "2026-09-05T09:00:00",
    historique: [
      { date: "2026-09-05T09:00:00", acteurId: "a7", action: "Demande déposée" },
      { date: "2026-09-06T10:00:00", acteurId: "a6", action: "Rejetée", commentaire: "Besoin d'en connaître non justifié — agent en détachement" },
    ],
  },
  {
    id: "h5", reference: "HAB-2026-0143", demandeurId: "a10", type: "ARMURERIE",
    motif: "Renouvellement d'accès à l'armurerie du PSIG.",
    dureeMois: 12, statut: "EN_ATTENTE", createdAt: "2026-10-03T07:50:00",
    historique: [{ date: "2026-10-03T07:50:00", acteurId: "a10", action: "Demande déposée" }],
  },
  {
    id: "h6", reference: "HAB-2026-0144", demandeurId: "a1", type: "FICHIERS_CONFIDENTIELS",
    motif: "Accès au module de rapprochement judiciaire pour l'animation des enquêtes de l'unité.",
    dureeMois: 12, statut: "EN_ATTENTE", createdAt: "2026-10-04T15:00:00",
    historique: [{ date: "2026-10-04T15:00:00", acteurId: "a1", action: "Demande déposée" }],
  },
];

export const OFFRES: Offre[] = [
  {
    type: "GAV",
    titre: "Gendarme adjoint volontaire",
    accroche: "Premier engagement au contact de la population, aux côtés des gendarmes de carrière.",
    conditions: ["Nationalité française", "Âge indicatif : 17 à 26 ans", "Sans condition de diplôme", "Sélection : tests, entretien, aptitude médicale"],
    duree: "Contrat de 3 ans renouvelable",
  },
  {
    type: "SOUS_OFFICIER",
    titre: "Sous-officier de gendarmerie",
    accroche: "Le cœur du métier : sécurité publique, police judiciaire, intervention, spécialités.",
    conditions: ["Nationalité française", "Baccalauréat (ou équivalent)", "Concours : épreuves écrites, sportives et oral", "Formation en école de 12 mois"],
    duree: "Carrière",
  },
  {
    type: "OFFICIER",
    titre: "Officier de gendarmerie",
    accroche: "Commander, décider, conduire des unités et des projets d'envergure.",
    conditions: ["Nationalité française", "Master ou diplôme d'ingénieur (recrutement externe)", "Concours sur épreuves", "Formation à l'école des officiers"],
    duree: "Carrière",
  },
];

export const CANDIDATURES: Candidature[] = [
  { id: "c1", reference: "CAND-2026-0412", offre: "SOUS_OFFICIER", nom: "Dubois", prenom: "Camille", email: "camille.dubois@exemple.test", dateNaissance: "2002-04-11", niveauEtudes: "Bac+2", etape: "EPREUVES", createdAt: "2026-09-02T10:00:00", historique: [] },
  { id: "c2", reference: "CAND-2026-0418", offre: "GAV", nom: "Martin", prenom: "Yanis", email: "yanis.martin@exemple.test", dateNaissance: "2006-01-23", niveauEtudes: "CAP / BEP", etape: "DOSSIER_RECU", createdAt: "2026-10-02T15:20:00", historique: [] },
  { id: "c3", reference: "CAND-2026-0399", offre: "OFFICIER", nom: "Nguyen", prenom: "Alice", email: "alice.nguyen@exemple.test", dateNaissance: "1999-07-30", niveauEtudes: "Bac+5", etape: "VISITE_MEDICALE", createdAt: "2026-08-20T09:00:00", historique: [] },
  { id: "c4", reference: "CAND-2026-0385", offre: "SOUS_OFFICIER", nom: "Bernard", prenom: "Lucas", email: "lucas.bernard@exemple.test", dateNaissance: "2001-12-05", niveauEtudes: "Baccalauréat", etape: "RETENU", createdAt: "2026-07-15T11:00:00", historique: [] },
  { id: "c5", reference: "CAND-2026-0421", offre: "GAV", nom: "Lefèvre", prenom: "Manon", email: "manon.lefevre@exemple.test", dateNaissance: "2005-03-18", niveauEtudes: "Baccalauréat", etape: "DOSSIER_RECU", createdAt: "2026-10-05T18:42:00", historique: [] },
  { id: "c6", reference: "CAND-2026-0402", offre: "SOUS_OFFICIER", nom: "Garcia", prenom: "Rayan", email: "rayan.garcia@exemple.test", dateNaissance: "2000-09-09", niveauEtudes: "Bac+3", etape: "EPREUVES", createdAt: "2026-08-28T08:15:00", historique: [] },
];

export const AUDIT = chainAudit([
  { id: "l1", date: "2026-10-06T08:02:11", acteur: "CDT LAMBERT (176540)", role: "ADMIN", action: "CONNEXION", cible: "session (MFA validée)", ip: "10.45.0.12" },
  { id: "l2", date: "2026-10-06T08:15:40", acteur: "CDT LAMBERT (176540)", role: "ADMIN", action: "AGENT_MODIFIE", cible: "agent 259903 — statut SUSPENDU", ip: "10.45.0.12" },
  { id: "l3", date: "2026-10-06T10:30:02", acteur: "GND MOREAU (245781)", role: "AGENT", action: "PROCEDURE_CREEE", cible: "PV 4512/00346/2026", ip: "10.45.12.37" },
  { id: "l4", date: "2026-10-07T07:58:19", acteur: "CNE ARNAUD (198734)", role: "OFFICIER", action: "CONNEXION", cible: "session (MFA validée)", ip: "10.45.12.10" },
  { id: "l5", date: "2026-10-07T08:05:44", acteur: "CNE ARNAUD (198734)", role: "OFFICIER", action: "PROCEDURE_CONSULTEE", cible: "PV 4512/00341/2026", ip: "10.45.12.10" },
]);
