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
  Audition,
  AuditLog,
  AuthRole,
  Candidature,
  DemandeAcces,
  DemandeHabilitation,
  EtapeCandidature,
  HabilitationStatut,
  PrePlainte,
  Procedure,
  ProcedureStatut,
  Role,
  StatutPrePlainte,
  Unite,
} from "@/lib/types";
import { auditPayload, demoHash, GENESIS_HASH, nowLocal, uid } from "@/lib/utils";

export interface DemoState {
  role: Role;
  currentUserId?: string; // id de l'agent connecté
  unites: Unite[];
  agents: Agent[];
  demandesAcces: DemandeAcces[];
  procedures: Procedure[];
  auditions: Audition[];
  habilitations: DemandeHabilitation[];
  candidatures: Candidature[];
  prePlaintes: PrePlainte[];
  audit: AuditLog[];
}

export type DemoAction =
  | { type: "SET_ROLE"; role: Role }
  | { type: "LOGIN"; agentId: string }
  | { type: "LOGOUT" }
  | { type: "UPSERT_AGENT"; agent: Agent }
  | { type: "REVOKE_AGENT"; id: string; motif: string }
  | { type: "SET_AGENT_ROLE"; id: string; role: AuthRole }
  | { type: "ACCEPT_CANDIDATURE_AND_CREATE_AGENT"; candidatureId: string; agentData: Omit<Agent, "id" | "dateIncorporation"> }
  | { type: "PROCEDURE_CREATE"; procedure: Procedure }
  | { type: "PROCEDURE_UPDATE"; id: string; updates: Partial<Procedure>; commentaire?: string }
  | { type: "PROCEDURE_DELETE"; id: string; motif: string }
  | { type: "SYNC_PROCEDURES"; procedures: Procedure[] }
  | { type: "PROCEDURE_VIEW"; id: string }
  | { type: "PROCEDURE_TRANSITION"; id: string; to: ProcedureStatut; commentaire: string; parquet?: string }
  | { type: "PROCEDURE_ADD_RAPPORT"; id: string; contenu: string }
  | { type: "PROCEDURE_ADD_AUDITION"; audition: Audition }
  | { type: "SYNC_AUDITIONS"; auditions: Audition[] }
  | { type: "HABILITATION_CREATE"; demande: DemandeHabilitation }
  | { type: "HABILITATION_DECIDE"; id: string; statut: Exclude<HabilitationStatut, "EN_ATTENTE">; commentaire: string }
  | { type: "CANDIDATURE_CREATE"; candidature: Candidature }
  | { type: "CANDIDATURE_MOVE"; id: string; etape: EtapeCandidature }
  | { type: "DEMANDE_ACCES_CREATE"; demande: DemandeAcces }
  | { type: "DEMANDE_ACCES_DECIDE"; id: string; statut: "VALIDEE" | "REJETEE"; commentaire?: string; roleAttribue?: AuthRole; motDePasse?: string }
  | { type: "SYNC_DEMANDES_ACCES"; demandes: DemandeAcces[] }
  | { type: "PRE_PLAINTE_CREATE"; prePlainte: PrePlainte }
  | { type: "PRE_PLAINTE_UPDATE_STATUT"; id: string; statut: StatutPrePlainte; dateRdv?: string }
  | { type: "PRE_PLAINTE_CONVERT_TO_PROCEDURE"; id: string; procedure: Procedure }
  | { type: "SYNC_PRE_PLAINTES"; prePlaintes: PrePlainte[] }
  | { type: "SYNC_AGENTS"; agents: Agent[] }
  | { type: "HYDRATE"; state: DemoState }
  | { type: "RESET" };

const STORAGE_KEY = "sentinelle-db-v6";
const STORAGE_VERSION = 6;

function initialState(): DemoState {
  return {
    role: "VISITEUR",
    unites: seed.UNITES,
    agents: seed.AGENTS,
    demandesAcces: [],
    procedures: seed.PROCEDURES,
    auditions: [],
    habilitations: seed.HABILITATIONS,
    candidatures: seed.CANDIDATURES,
    prePlaintes: [],
    audit: seed.AUDIT,
  };
}

function actor(state: DemoState): { id: string; label: string } {
  if (state.role === "VISITEUR") return { id: "visiteur", label: "Visiteur anonyme" };
  const a = state.currentUserId
    ? state.agents.find((x) => x.id === state.currentUserId)
    : state.agents.find((x) => x.id === DEMO_ACCOUNTS[state.role as AuthRole]);
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

    case "LOGIN": {
      const agent = state.agents.find((a) => a.id === action.agentId);
      if (!agent) return state;
      const next: DemoState = { ...state, role: agent.role, currentUserId: agent.id };
      return withAudit(next, "CONNEXION", `Connexion réussie — Mle ${agent.matricule} (${ROLE_LABEL[agent.role]})`);
    }

    case "LOGOUT": {
      const next: DemoState = { ...state, role: "VISITEUR", currentUserId: undefined };
      return withAudit(next, "DECONNEXION", "Déconnexion de session");
    }

    case "SET_ROLE": {
      if (action.role === "VISITEUR") return { ...withAudit(state, "DECONNEXION", "session"), role: "VISITEUR", currentUserId: undefined };
      const demoAgent = state.agents.find((x) => x.id === DEMO_ACCOUNTS[action.role as AuthRole]);
      const next = { ...state, role: action.role, currentUserId: demoAgent?.id };
      return withAudit(next, "CONNEXION", `session (MFA validée) — profil ${ROLE_LABEL[action.role]}`);
    }

    case "ACCEPT_CANDIDATURE_AND_CREATE_AGENT": {
      const now = nowLocal();
      const newAgent: Agent = {
        ...action.agentData,
        id: uid(),
        dateIncorporation: now.slice(0, 10),
      };
      const cand = state.candidatures.find((c) => c.id === action.candidatureId);
      const candidatures = state.candidatures.map((c) => {
        if (c.id !== action.candidatureId) return c;
        return {
          ...c,
          etape: "RETENU" as const,
          historique: [
            ...c.historique,
            {
              date: now,
              acteurId: me.id,
              action: `Candidature acceptée et incorporée : Mle ${newAgent.matricule} (${newAgent.identifiant})`,
            },
          ],
        };
      });
      const agents = [newAgent, ...state.agents];
      const stateWithAgent = withAudit(
        { ...state, candidatures, agents },
        "CANDIDATURE_RETENUE",
        `Candidature ${cand?.reference ?? action.candidatureId} acceptée -> Agent Mle ${newAgent.matricule} créé`
      );
      return stateWithAgent;
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

    case "PROCEDURE_UPDATE": {
      let num = "";
      const now = nowLocal();
      const procedures = state.procedures.map((p) => {
        if (p.id !== action.id) return p;
        num = p.numeroPV;
        return {
          ...p,
          ...action.updates,
          historique: [
            ...p.historique,
            {
              date: now,
              acteurId: me.id,
              action: action.commentaire ? `Modification : ${action.commentaire}` : "Procédure modifiée",
            },
          ],
        };
      });
      return withAudit({ ...state, procedures }, "PROCEDURE_MODIFIEE", `PV ${num}`);
    }

    case "PROCEDURE_DELETE": {
      const target = state.procedures.find((p) => p.id === action.id);
      const procedures = state.procedures.filter((p) => p.id !== action.id);
      const auditions = (state.auditions || []).filter((a) => a.procedureId !== action.id);
      return withAudit(
        { ...state, procedures, auditions },
        "PROCEDURE_SUPPRIMEE",
        `PV ${target?.numeroPV ?? action.id} — Motif : ${action.motif}`
      );
    }

    case "SYNC_PROCEDURES":
      return { ...state, procedures: action.procedures };

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

    case "PROCEDURE_ADD_AUDITION": {
      const now = nowLocal();
      const auditions = [action.audition, ...(state.auditions || [])];
      let numPV = "";
      const procedures = state.procedures.map((p) => {
        if (p.id !== action.audition.procedureId) return p;
        numPV = p.numeroPV;
        return {
          ...p,
          auditions: [action.audition, ...(p.auditions || [])],
          historique: [
            ...p.historique,
            {
              date: now,
              acteurId: me.id,
              action: `Audition réalisée (${action.audition.typeAudition}) : ${action.audition.prenom} ${action.audition.nom.toUpperCase()} - PV ${action.audition.numeroPV}`,
            },
          ],
        };
      });
      return withAudit(
        { ...state, auditions, procedures },
        "AUDITION_REALISEE",
        `Dossier ${numPV} — Audition ${action.audition.numeroPV} (${action.audition.prenom} ${action.audition.nom.toUpperCase()})`
      );
    }

    case "SYNC_AUDITIONS":
      return { ...state, auditions: action.auditions };

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

    case "DEMANDE_ACCES_CREATE":
      return withAudit(
        { ...state, demandesAcces: [action.demande, ...(state.demandesAcces || [])] },
        "DEMANDE_ACCES_DEPOSEE",
        `Réf. ${action.demande.reference} (${action.demande.nom.toUpperCase()} ${action.demande.prenom} - Mle ${action.demande.matricule})`
      );

    case "DEMANDE_ACCES_DECIDE": {
      const d = (state.demandesAcces || []).find((x) => x.id === action.id);
      if (!d) return state;

      const updatedDemandes = (state.demandesAcces || []).map((x) => {
        if (x.id !== action.id) return x;
        return {
          ...x,
          statut: action.statut,
          reponseComment: action.commentaire || x.reponseComment,
          motDePasseInitial: action.motDePasse || x.motDePasseInitial,
          roleAttribue: action.roleAttribue || x.roleAttribue,
          traiteParId: me.id,
        };
      });

      if (action.statut === "VALIDEE") {
        const pass = action.motDePasse || "Sentinelle2026!";
        const chosenRole = action.roleAttribue || "AGENT";
        const newAgent: Agent = {
          id: uid(),
          matricule: d.matricule,
          institution: d.institution,
          nom: d.nom,
          prenom: d.prenom,
          grade: d.grade,
          uniteId: d.uniteId,
          affectation: d.affectation,
          statut: "ACTIF",
          qualification: d.qualification,
          role: chosenRole,
          email: d.email,
          identifiant: d.matricule,
          motDePasse: pass,
          dateIncorporation: nowLocal().slice(0, 10),
        };

        const existingIdx = state.agents.findIndex((a) => a.matricule === d.matricule);
        const nextAgents = existingIdx >= 0
          ? state.agents.map((a, i) => (i === existingIdx ? newAgent : a))
          : [newAgent, ...state.agents];

        return withAudit(
          { ...state, demandesAcces: updatedDemandes, agents: nextAgents },
          "ACCES_INTRANET_ACTIVE",
          `Compte activé pour Mle ${d.matricule} (${d.prenom} ${d.nom.toUpperCase()}) — Rôle : ${chosenRole}`
        );
      }

      return withAudit(
        { ...state, demandesAcces: updatedDemandes },
        "DEMANDE_ACCES_REFUSEE",
        `Demande ${d.reference} refusée pour Mle ${d.matricule} — Motif : ${action.commentaire || "Non spécifié"}`
      );
    }

    case "SYNC_DEMANDES_ACCES":
      return { ...state, demandesAcces: action.demandes };

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

    case "PRE_PLAINTE_CREATE":
      return withAudit(
        { ...state, prePlaintes: [action.prePlainte, ...state.prePlaintes] },
        "PRE_PLAINTE_ENREGISTREE",
        `Dossier ${action.prePlainte.numeroDossier} (${action.prePlainte.victimeNom} ${action.prePlainte.victimePrenom})`
      );

    case "PRE_PLAINTE_UPDATE_STATUT": {
      let ref = "";
      const prePlaintes = state.prePlaintes.map((p) => {
        if (p.id !== action.id) return p;
        ref = p.numeroDossier;
        return {
          ...p,
          statut: action.statut,
          dateRdv: action.dateRdv ?? p.dateRdv,
        };
      });
      return withAudit(
        { ...state, prePlaintes },
        "PRE_PLAINTE_STATUT",
        `Dossier ${ref} → Statut : ${action.statut}${action.dateRdv ? ` (RDV : ${action.dateRdv})` : ""}`
      );
    }

    case "PRE_PLAINTE_CONVERT_TO_PROCEDURE": {
      let ref = "";
      const prePlaintes = state.prePlaintes.map((p) => {
        if (p.id !== action.id) return p;
        ref = p.numeroDossier;
        return { ...p, statut: "TRANSFORMEE_EN_PV" as const };
      });
      const procedures = [action.procedure, ...state.procedures];
      return withAudit(
        { ...state, prePlaintes, procedures },
        "PRE_PLAINTE_TRANSFORMEE_PV",
        `Dossier ${ref} converti en Procédure PV ${action.procedure.numeroPV}`
      );
    }

    case "SYNC_PRE_PLAINTES":
      return { ...state, prePlaintes: action.prePlaintes };

    case "SYNC_AGENTS": {
      // Si la base contient des agents, on les utilise, en s'assurant que le compte admin initial est toujours présent
      const merged = action.agents.length > 0 ? action.agents : seed.AGENTS;
      return { ...state, agents: merged };
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
    // 1. Nettoyage immédiat de tout ancien stockage de démonstration
    try {
      window.localStorage.removeItem("sentinelle-demo");
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { version: number; state: DemoState };
        if (parsed.version === STORAGE_VERSION) {
          // Filtrer tout agent résiduel fictif : seul le compte admin ou agents créés légitimement
          const validAgents = (parsed.state.agents || []).filter(
            (a) => a.id === "admin-1" || a.dateIncorporation >= "2026-10-09"
          );
          // Toujours s'assurer que toutes les unités institutionnelles sont présentes
          const mergedUnites = [...seed.UNITES];
          for (const u of (parsed.state.unites || [])) {
            if (!mergedUnites.some((item) => item.id === u.id)) {
              mergedUnites.push(u);
            }
          }
          dispatch({
            type: "HYDRATE",
            state: {
              ...parsed.state,
              unites: mergedUnites,
              agents: validAgents.length ? validAgents : seed.AGENTS,
            },
          });
        }
      }
    } catch {
      /* stockage corrompu : on repart des données d'amorçage */
    }
    setHydrated(true);

    // 2. Synchronisation en direct avec la base PostgreSQL Supabase pour les pré-plaintes
    fetch("/api/pre-plainte")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const list: PrePlainte[] = data.data.map((item: any) => ({
            id: item.id,
            numeroDossier: item.numeroDossier,
            typeInfraction: item.typeInfraction,
            dateFaits: typeof item.dateFaits === "string" ? item.dateFaits : new Date(item.dateFaits).toISOString(),
            lieuFaits: item.lieuFaits,
            description: item.description,
            auteurInconnu: item.auteurInconnu,
            prejudiceEstime: item.prejudiceEstime,
            statut: item.statut,
            dateRdv: item.dateRdv ? new Date(item.dateRdv).toLocaleString("fr-FR") : undefined,
            createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(item.createdAt).toISOString(),
            victimeNom: item.victimeNom,
            victimePrenom: item.victimePrenom,
            victimeEmail: item.victimeEmail,
            victimeTelephone: item.victimeTelephone,
            victimeAdresse: item.victimeAdresse,
            uniteId: item.uniteId,
            agentId: item.agentId,
          }));
          dispatch({ type: "SYNC_PRE_PLAINTES", prePlaintes: list });
        }
      })
      .catch((e) => console.error("Erreur sync pré-plaintes:", e));

    // 3. Synchronisation en direct avec la base PostgreSQL Supabase pour les agents
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          dispatch({ type: "SYNC_AGENTS", agents: data.data });
        }
      })
      .catch((e) => console.error("Erreur sync agents:", e));

    // 4. Synchronisation en direct avec la base PostgreSQL Supabase pour les auditions
    fetch("/api/auditions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          dispatch({ type: "SYNC_AUDITIONS", auditions: data.data });
        }
      })
      .catch((e) => console.error("Erreur sync auditions:", e));

    // 5. Synchronisation en direct avec la base PostgreSQL Supabase pour les procédures judiciaires
    fetch("/api/procedures")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          dispatch({ type: "SYNC_PROCEDURES", procedures: data.data });
        }
      })
      .catch((e) => console.error("Erreur sync procédures:", e));

    // 6. Synchronisation en direct avec la base PostgreSQL Supabase pour les demandes d'accès
    fetch("/api/demandes-acces")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          dispatch({ type: "SYNC_DEMANDES_ACCES", demandes: data.data });
        }
      })
      .catch((e) => console.error("Erreur sync demandes d'accès:", e));
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
    let agent: Agent | undefined;
    if (state.currentUserId) {
      agent = state.agents.find((a) => a.id === state.currentUserId);
    }
    if (!agent) {
      const fallbackRole = state.role as AuthRole;
      agent = state.agents.find((a) => a.id === DEMO_ACCOUNTS[fallbackRole]);
    }
    if (!agent) return null;
    const unite =
      state.unites.find((u) => u.id === agent.uniteId) ||
      seed.UNITES.find((u) => u.id === agent.uniteId) ||
      seed.UNITES[0];
    const role = agent.role;
    return { role, agent, unite, subject: { role, agentId: agent.id, uniteId: agent.uniteId } };
  }, [state.role, state.currentUserId, state.agents, state.unites]);
}
