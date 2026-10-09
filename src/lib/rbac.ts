import type { DemandeHabilitation, Role } from "./types";

/**
 * RBAC — matrice permission × rôle avec portée (scope).
 *
 *  - "own"  : uniquement les ressources dont l'utilisateur est propriétaire (rédacteur, demandeur)
 *  - "unit" : ressources rattachées à l'unité de l'utilisateur
 *  - "all"  : toutes les ressources
 *
 * IMPORTANT : en production, cette même matrice est évaluée CÔTÉ SERVEUR
 * (middleware + Server Actions + Row Level Security PostgreSQL). Le filtrage
 * côté client n'est qu'un confort d'affichage, jamais une barrière de sécurité.
 */
export type Permission =
  | "public:read"
  | "recrutement:postuler"
  | "dashboard:view"
  | "procedures:read"
  | "procedures:create"
  | "procedures:rapport"
  | "procedures:validate"
  | "preplaintes:read"
  | "preplaintes:manage"
  | "habilitations:request"
  | "habilitations:review"
  | "agents:read"
  | "agents:manage"
  | "roles:assign"
  | "recrutement:manage"
  | "audit:read";

export type Scope = "own" | "unit" | "all";

const PUBLIC: Partial<Record<Permission, Scope>> = {
  "public:read": "all",
  "recrutement:postuler": "all",
};

const AGENT: Partial<Record<Permission, Scope>> = {
  ...PUBLIC,
  "dashboard:view": "own",
  "procedures:read": "unit",
  "procedures:create": "unit",
  "procedures:rapport": "unit",
  "preplaintes:read": "unit",
  "preplaintes:manage": "unit",
  "habilitations:request": "own",
};

export const RBAC_MATRIX: Record<Role, Partial<Record<Permission, Scope>>> = {
  VISITEUR: PUBLIC,
  AGENT,
  OFFICIER: {
    ...AGENT,
    "procedures:validate": "unit",
    "habilitations:review": "unit",
    "agents:read": "unit",
  },
  // Magistrat (Procureur de la République, Juges du tribunal) : direction des enquêtes, instructions et orientation
  MAGISTRAT: {
    ...PUBLIC,
    "dashboard:view": "all",
    "procedures:read": "all",
    "procedures:validate": "all",
    "procedures:rapport": "all",
    "agents:read": "all",
    "audit:read": "all",
  },
  // Avocat au Barreau : consultation des dossiers judiciaires et observations
  AVOCAT: {
    ...PUBLIC,
    "dashboard:view": "own",
    "procedures:read": "all",
    "procedures:rapport": "own",
  },
  // Séparation des tâches : l'administrateur RH/DSI gère les effectifs et les droits
  // mais n'a PAS accès au contenu des procédures judiciaires (secret de l'enquête).
  ADMIN: {
    ...PUBLIC,
    "dashboard:view": "all",
    "procedures:read": "all",
    "preplaintes:read": "all",
    "preplaintes:manage": "all",
    "habilitations:request": "own",
    "habilitations:review": "all",
    "agents:read": "all",
    "agents:manage": "all",
    "roles:assign": "all",
    "recrutement:manage": "all",
    "audit:read": "all",
  },
};

export interface Subject {
  role: Role;
  agentId: string;
  uniteId: string;
}

export interface ResourceRef {
  uniteId?: string;
  ownerId?: string;
}

export function scopeOf(role: Role, perm: Permission): Scope | null {
  return RBAC_MATRIX[role][perm] ?? null;
}

export function can(role: Role, perm: Permission): boolean {
  return scopeOf(role, perm) !== null;
}

/** Contrôle d'accès au niveau de la ressource (ABAC léger par portée). */
export function canOnResource(subject: Subject, perm: Permission, res: ResourceRef): boolean {
  const scope = scopeOf(subject.role, perm);
  if (!scope) return false;
  if (scope === "all") return true;
  if (scope === "unit") return res.uniteId === subject.uniteId;
  return res.ownerId === subject.agentId;
}

/**
 * Règle des « quatre yeux » : un valideur ne peut jamais instruire sa propre demande.
 */
export function canReviewHabilitation(
  subject: Subject,
  demande: DemandeHabilitation,
  demandeurUniteId: string | undefined,
): boolean {
  if (demande.demandeurId === subject.agentId) return false;
  return canOnResource(subject, "habilitations:review", { uniteId: demandeurUniteId });
}
