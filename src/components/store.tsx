"use client";

/**
 * Store de démonstration (useReducer + localStorage).
 * Simule la couche serveur : chaque mutation produit une entrée dans le journal d'audit chaîné.
 * En production, ces actions sont des Server Actions / routes API qui ré-évaluent le RBAC.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useState, type Dispatch, type ReactNode } from "react";
import * as seed from "@/lib/mock-data";
import { DEMO_ACCOUNTS } from "@/lib/mock-data";
import { GRADE_ABBR, ROLE_LABEL } from "@/lib/labels";
import type { Subject } from "@/lib/rbac";
import type {
  Agent,
  AuditLog,
  AuthRole,
  Candidature,
  DemandeHabilitation,
  EtapeCandidature,
  HabilitationStatut,
  Procedure,
  ProcedureStatut,
  Role,
  Unite,
} from "@/lib/types";
import { auditPayload, demoHash, GENESIS_HASH, nowLocal, uid } from "@/lib/utils";

export interface DemoState {
  role: Role;
  unites: Unite[];
  agents: Agent[];
  procedures: Procedure[];
  habilitations: DemandeHabilitation[];
  candidatures: Candidature[];
  audit: AuditLog[];
}

export type DemoAction =
  | { type: "SET_ROLE"; role: Role }
  | { type: "UPSERT_AGENT"; agent: Agent }
  | { type: "REVOKE_AGENT"; id: string; motif: string }
  | { type: "SET_AGENT_ROLE"; id: string; role: AuthRole }
  | { type: "PROCEDURE_CREATE"; procedure: Procedure }
  | { type: "PROCEDURE_VIEW"; id: string }
  | { type: "PROCEDURE_TRANSITION"; id: string; to: ProcedureStatut; commentaire: string; parquet?: string }
  | { type: "PROCEDURE_ADD_RAPPORT"; id: string; contenu: string }
  | { type: "HABILITATION_CREATE"; demande: DemandeHabilitation }
  | { type: "HABILITATION_DECIDE"; id: string; statut: Exclude<HabilitationStatut, "EN_ATTENTE">; commentaire: string }
  | { type: "CANDIDATURE_CREATE"; candidature: Candidature }
  | { type: "CANDIDATURE_MOVE"; id: string; etape: EtapeCandidature }
  | { type: "HYDRATE"; state: DemoState }
  | { type: "RESET" };

const STORAGE_KEY = "sentinelle-demo";
const STORAGE_VERSION = 1;

function initialState(): DemoState {
  return {
    role: "VISITEUR",
    unites: seed.UNITES,
    agents: seed.AGENTS,
    procedures: seed.PROCEDURES,
    habilitations: seed.HABILITATIONS,
    candidatures: seed.CANDIDATURES,
    audit: seed.AUDIT,
  };
}

function actor(state: DemoState): { id: string; label: string } {
  if (state.role === "VISITEUR") return { id: "visiteur", label: "Visiteur anonyme" };
  const a = state.agents.find((x) => x.id === DEMO_ACCOUNTS[state.role as AuthRole]);
  return a ? { id: a.id, label: `${GRADE_ABBR[a.grade]} ${a.nom.toUpperCase()} (${a.matricule})` } : { id: "?", label: "Inconnu" };
}

function withAudit(state: DemoState, action: string, cible: string): DemoState {
  const prevHash = state.audit[0]?.hash ?? GENESIS_HASH;
  const draft = { id: uid(), date: nowLocal(), acteur: actor(state).label, role: state.role, action, cible, ip: "10.45.12.37" };
  const entry: AuditLog = { ...draft, prevHash, hash: demoHash(prevHash + auditPayload(draft)) };
  return { ...state, audit: [entry, ...state.audit] };
}

function reducer(state: DemoState, action: DemoAction): DemoState {
  const me = actor(state);
  switch (action.type) {
    case "HYDRATE":
      return action.state;
    case "RESET":
      return { ...initialState(), role: state.role };

    case "SET_ROLE": {
      if (action.role === "VISITEUR") return { ...withAudit(state, "DECONNEXION", "session"), role: "VISITEUR" };
      const next = { ...state, role: action.role };
      return withAudit(next, "CONNEXION", `session (MFA validée) — profil ${ROLE_LABEL[action.role]}`);
    }

    case "UPSERT_AGENT": {
      const exists = state.agents.some((a) => a.id === action.agent.id);
      const agents = exists ? state.agents.map((a) => (a.id === action.agent.id ? action.agent : a)) : [action.agent, ...state.agents];
      return withAudit({ ...state, agents }, exists ? "AGENT_MODIFIE" : "AGENT_CREE", `agent ${action.agent.matricule}`);
    }

    case "REVOKE_AGENT": {
      let mat = "";
      const agents = state.agents.map((a) => {
        if (a.id !== action.id) return a;
        mat = a.matricule;
        return { ...a, statut: "RADIE" as const, revocation: { date: nowLocal(), motif: action.motif, par: me.label } };
      });
      return withAudit({ ...state, agents }, "AGENT_REVOQUE", `agent ${mat} — accès désactivés, sessions invalidées`);
    }

    case "SET_AGENT_ROLE": {
      let mat = "";
      const agents = state.agents.map((a) => {
        if (a.id !== action.id) return a;
        mat = a.matricule;
        return { ...a, role: action.role };
      });
      return withAudit({ ...state, agents }, "ROLE_ATTRIBUE", `agent ${mat} → ${ROLE_LABEL[action.role]}`);
    }

    case "PROCEDURE_CREATE":
      return withAudit({ ...state, procedures: [action.procedure, ...state.procedures] }, "PROCEDURE_CREEE", `PV ${action.procedure.numeroPV}`);

    case "PROCEDURE_VIEW": {
      const p = state.procedures.find((x) => x.id === action.id);
      return p ? withAudit(state, "PROCEDURE_CONSULTEE", `PV ${p.numeroPV}`) : state;
    }

    case "PROCEDURE_TRANSITION": {
      let num = "";
      const label = action.to === "TRANSMISE_PARQUET" ? "Validée et transmise au parquet" : action.to === "CLASSEE" ? "Classée" : "Réouverte";
      const procedures = state.procedures.map((p) => {
        if (p.id !== action.id) return p;
        num = p.numeroPV;
        return {
          ...p,
          statut: action.to,
          valideParId: action.to === "TRANSMISE_PARQUET" ? me.id : p.valideParId,
          parquet: action.parquet ?? p.parquet,
          historique: [...p.historique, { date: nowLocal(), acteurId: me.id, action: label, commentaire: action.commentaire || undefined }],
        };
      });
      return withAudit({ ...state, procedures }, `PROCEDURE_${action.to}`, `PV ${num}`);
    }

    case "PROCEDURE_ADD_RAPPORT": {
      let num = "";
      const now = nowLocal();
      const procedures = state.procedures.map((p) => {
        if (p.id !== action.id) return p;
        num = p.numeroPV;
        return {
          ...p,
          rapports: [...p.rapports, { id: uid(), auteurId: me.id, date: now, contenu: action.contenu }],
          historique: [...p.historique, { date: now, acteurId: me.id, action: "Rapport ajouté" }],
        };
      });
      return withAudit({ ...state, procedures }, "RAPPORT_AJOUTE", `PV ${num}`);
    }

    case "HABILITATION_CREATE":
      return withAudit({ ...state, habilitations: [action.demande, ...state.habilitations] }, "HABILITATION_DEMANDEE", action.demande.reference);

    case "HABILITATION_DECIDE": {
      let ref = "";
      const habilitations = state.habilitations.map((h) => {
        if (h.id !== action.id) return h;
        ref = h.reference;
        return {
          ...h,
          statut: action.statut,
          historique: [
            ...h.historique,
            { date: nowLocal(), acteurId: me.id, action: action.statut === "VALIDEE" ? "Validée" : "Rejetée", commentaire: action.commentaire || undefined },
          ],
        };
      });
      return withAudit({ ...state, habilitations }, `HABILITATION_${action.statut}`, ref);
    }

    case "CANDIDATURE_CREATE":
      return withAudit({ ...state, candidatures: [action.candidature, ...state.candidatures] }, "CANDIDATURE_DEPOSEE", action.candidature.reference);

    case "CANDIDATURE_MOVE": {
      let ref = "";
      const candidatures = state.candidatures.map((c) => {
        if (c.id !== action.id) return c;
        ref = c.reference;
        return { ...c, etape: action.etape, historique: [...c.historique, { date: nowLocal(), acteurId: me.id, action: `Étape : ${action.etape}` }] };
      });
      return withAudit({ ...state, candidatures }, "CANDIDATURE_ETAPE", `${ref} → ${action.etape}`);
    }
  }
}

interface Ctx {
  state: DemoState;
  dispatch: Dispatch<DemoAction>;
  hydrated: boolean;
}

const DemoContext = createContext<Ctx | null>(null);

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { version: number; state: DemoState };
        if (parsed.version === STORAGE_VERSION) dispatch({ type: "HYDRATE", state: parsed.state });
      }
    } catch {
      /* stockage corrompu : on repart des données d'amorçage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: STORAGE_VERSION, state }));
  }, [state, hydrated]);

  const value = useMemo(() => ({ state, dispatch, hydrated }), [state, hydrated]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): Ctx {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo doit être utilisé dans <DemoStoreProvider>");
  return ctx;
}

export interface CurrentUser {
  role: AuthRole;
  agent: Agent;
  unite: Unite;
  subject: Subject;
}

export function useCurrentUser(): CurrentUser | null {
  const { state } = useDemo();
  return useMemo(() => {
    if (state.role === "VISITEUR") return null;
    const role = state.role as AuthRole;
    const agent = state.agents.find((a) => a.id === DEMO_ACCOUNTS[role]);
    const unite = agent && state.unites.find((u) => u.id === agent.uniteId);
    if (!agent || !unite) return null;
    return { role, agent, unite, subject: { role, agentId: agent.id, uniteId: agent.uniteId } };
  }, [state.role, state.agents, state.unites]);
}
