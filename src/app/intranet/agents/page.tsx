"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Ban, Pencil, Search, UserPlus } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, EmptyState, Field, inputCls, Modal, PageHeader, Td, Th } from "@/components/ui";
import { can, canOnResource } from "@/lib/rbac";
import { GRADE_ABBR, GRADE_LABEL, QUALIF_LABEL, ROLE_LABEL, STATUT_AGENT } from "@/lib/labels";
import type { Agent, AuthRole, Grade, QualifJudiciaire, StatutActivite } from "@/lib/types";
import { fmtDate, uid } from "@/lib/utils";

export default function AgentsPage() {
  return (
    <Guard perm="agents:read">
      <AgentsView />
    </Guard>
  );
}

function AgentsView() {
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;
  const isAdmin = can(me.role, "agents:manage");
  const [q, setQ] = useState("");
  const [unite, setUnite] = useState("");
  const [statut, setStatut] = useState("");
  const [editing, setEditing] = useState<Agent | "new" | null>(null);
  const [revoking, setRevoking] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);

  async function reloadAgentsFromDB() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        dispatch({ type: "SYNC_AGENTS", agents: d.data });
      }
    } catch (e) {
      console.error("Erreur sync agents:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadAgentsFromDB();
  }, []);

  const unitesById = useMemo(() => new Map(state.unites.map((u) => [u.id, u])), [state.unites]);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return state.agents
      .filter((a) => canOnResource(me.subject, "agents:read", { uniteId: a.uniteId }))
      .filter((a) => !s || `${a.matricule} ${a.nom} ${a.prenom} ${a.affectation}`.toLowerCase().includes(s))
      .filter((a) => !unite || a.uniteId === unite)
      .filter((a) => !statut || a.statut === statut)
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [state.agents, me.subject, q, unite, statut]);

  return (
    <>
      <PageHeader
        title="Effectifs & annuaire des agents"
        subtitle={isAdmin ? `Gestion complète des personnels — ${rows.length} agent(s) en service` : `Consultation limitée à votre unité : ${me.unite.nom}`}
        breadcrumb={<>Intranet › Ressources humaines › Effectifs</>}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reloadAgentsFromDB} disabled={loading}>
              {loading ? "Synchronisation..." : "Rafraîchir"}
            </Button>
            {isAdmin && (
              <Button onClick={() => setEditing("new")}>
                <UserPlus size={16} aria-hidden /> Ajouter un agent
              </Button>
            )}
          </div>
        }
      />

      <Card className="mb-6">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Field label="Rechercher" hint="Matricule, nom, prénom ou affectation" htmlFor="a-q">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden />
              <input id="a-q" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} pl-9`} />
            </div>
          </Field>
          <Field label="Unité" hint=" " htmlFor="a-unite">
            <select id="a-unite" value={unite} onChange={(e) => setUnite(e.target.value)} className={inputCls} disabled={!isAdmin}>
              <option value="">Toutes</option>
              {state.unites.map((u) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          </Field>
          <Field label="Statut d'activité" hint=" " htmlFor="a-statut">
            <select id="a-statut" value={statut} onChange={(e) => setStatut(e.target.value)} className={inputCls}>
              <option value="">Tous</option>
              {Object.entries(STATUT_AGENT).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
        </form>
      </Card>

      <Card title={<span aria-live="polite">{rows.length} agent(s)</span>}>
        <div className="-m-5 overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState>Aucun agent ne correspond à la recherche.</EmptyState>
          ) : (
            <table className="w-full border-collapse">
              <caption className="sr-only">Annuaire des agents</caption>
              <thead className="border-b-2 border-gend-900 bg-surface">
                <tr>
                  <Th>Matricule</Th>
                  <Th>Agent</Th>
                  <Th>Unité / affectation</Th>
                  <Th>Qualif. judiciaire</Th>
                  <Th>Statut</Th>
                  <Th>Rôle applicatif</Th>
                  {isAdmin && <Th className="text-right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => {
                  const st = STATUT_AGENT[a.statut];
                  const u = unitesById.get(a.uniteId);
                  const isSelf = a.id === me.agent.id;
                  return (
                    <tr key={a.id} className={i % 2 ? "bg-surface/60" : undefined}>
                      <Td className="font-mono font-bold text-gend-900">{a.matricule}</Td>
                      <Td>
                        <span className="font-bold">{a.nom.toUpperCase()}</span> {a.prenom}
                        <span className="block text-xs text-ink-mute">
                          {GRADE_LABEL[a.grade]} · incorporé le {fmtDate(a.dateIncorporation)}
                        </span>
                      </Td>
                      <Td>
                        {u?.nom}
                        <span className="block text-xs text-ink-mute">{a.affectation}</span>
                      </Td>
                      <Td>{QUALIF_LABEL[a.qualification]}</Td>
                      <Td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                        {a.revocation && <span className="mt-1 block max-w-[12rem] text-xs text-ink-mute">« {a.revocation.motif} »</span>}
                      </Td>
                      <Td>
                        {can(me.role, "roles:assign") && a.statut !== "RADIE" && !isSelf ? (
                          <select
                            aria-label={`Rôle de ${a.prenom} ${a.nom}`}
                            value={a.role}
                            onChange={(e) => {
                              const role = e.target.value as AuthRole;
                              if (window.confirm(`Attribuer le rôle « ${ROLE_LABEL[role]} » à ${a.prenom} ${a.nom.toUpperCase()} ?`)) {
                                dispatch({ type: "SET_AGENT_ROLE", id: a.id, role });
                              }
                            }}
                            className="border-b-2 border-ink bg-surface-alt px-2 py-1 text-xs"
                          >
                            {(["AGENT", "OFFICIER", "ADMIN"] as AuthRole[]).map((r) => (
                              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-sm">{a.statut === "RADIE" ? "Accès désactivé" : ROLE_LABEL[a.role]}</span>
                        )}
                      </Td>
                      {isAdmin && (
                        <Td className="whitespace-nowrap text-right">
                          <Button variant="tertiary" size="sm" onClick={() => setEditing(a)} aria-label={`Modifier ${a.prenom} ${a.nom}`}>
                            <Pencil size={14} aria-hidden /> Modifier
                          </Button>
                          {a.statut !== "RADIE" && !isSelf && (
                            <Button variant="tertiary" size="sm" className="text-marianne-dark hover:bg-marianne-light" onClick={() => setRevoking(a)} aria-label={`Révoquer ${a.prenom} ${a.nom}`}>
                              <Ban size={14} aria-hidden /> Révoquer
                            </Button>
                          )}
                        </Td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {isAdmin && (
        <>
          <AgentFormModal
            agent={editing}
            onClose={() => setEditing(null)}
            onSave={async (agent) => {
              dispatch({ type: "UPSERT_AGENT", agent });
              setEditing(null);
              try {
                await fetch("/api/agents", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(agent),
                });
                reloadAgentsFromDB();
              } catch (err) {
                console.warn("Échec sauvegarde BDD agent :", err);
              }
            }}
          />
          <RevokeModal
            agent={revoking}
            onClose={() => setRevoking(null)}
            onConfirm={(motif) => {
              if (revoking) dispatch({ type: "REVOKE_AGENT", id: revoking.id, motif });
              setRevoking(null);
            }}
          />
        </>
      )}
    </>
  );
}

function AgentFormModal({ agent, onClose, onSave }: { agent: Agent | "new" | null; onClose: () => void; onSave: (a: Agent) => void }) {
  const { state } = useDemo();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const current = agent && agent !== "new" ? agent : null;

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const errs: Record<string, string> = {};
    if (!/^\d{6}$/.test(v("matricule"))) errs.matricule = "Le matricule comporte 6 chiffres.";
    else if (state.agents.some((a) => a.matricule === v("matricule") && a.id !== current?.id)) errs.matricule = "Ce matricule est déjà attribué.";
    if (v("nom").length < 2) errs.nom = "Nom obligatoire.";
    if (v("prenom").length < 2) errs.prenom = "Prénom obligatoire.";
    if (!v("affectation")) errs.affectation = "Affectation obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) errs.email = "Adresse électronique invalide.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      ...(current ?? { id: uid(), dateIncorporation: new Date().toISOString().slice(0, 10) }),
      matricule: v("matricule"),
      nom: v("nom"),
      prenom: v("prenom"),
      grade: v("grade") as Grade,
      uniteId: v("uniteId"),
      affectation: v("affectation"),
      statut: v("statut") as StatutActivite,
      qualification: v("qualification") as QualifJudiciaire,
      role: v("role") as AuthRole,
      email: v("email"),
      identifiant: v("identifiant") || v("matricule"),
      motDePasse: v("motDePasse") || "Gend2026!",
    } as Agent);
  }

  const err = (k: string) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `ag-${k}-error` } : {});

  return (
    <Modal open={agent !== null} onClose={onClose} title={current ? `Modifier l'agent ${current.matricule}` : "Ajouter un agent"} size="lg">
      <form key={current?.id ?? "new"} onSubmit={submit} noValidate className="grid gap-4 md:grid-cols-2">
        <Field label="Matricule" hint="6 chiffres" htmlFor="ag-matricule" error={errors.matricule}>
          <input id="ag-matricule" name="matricule" defaultValue={current?.matricule} inputMode="numeric" maxLength={6} className={`${inputCls} font-mono`} {...err("matricule")} />
        </Field>
        <Field label="Grade" hint=" " htmlFor="ag-grade">
          <select id="ag-grade" name="grade" defaultValue={current?.grade ?? "GENDARME"} className={inputCls}>
            {(Object.keys(GRADE_LABEL) as Grade[]).map((g) => (
              <option key={g} value={g}>{GRADE_LABEL[g]} ({GRADE_ABBR[g]})</option>
            ))}
          </select>
        </Field>
        <Field label="Nom" htmlFor="ag-nom" error={errors.nom}>
          <input id="ag-nom" name="nom" defaultValue={current?.nom} className={inputCls} {...err("nom")} />
        </Field>
        <Field label="Prénom" htmlFor="ag-prenom" error={errors.prenom}>
          <input id="ag-prenom" name="prenom" defaultValue={current?.prenom} className={inputCls} {...err("prenom")} />
        </Field>
        <Field label="Unité" htmlFor="ag-unite">
          <select id="ag-unite" name="uniteId" defaultValue={current?.uniteId ?? "u1"} className={inputCls}>
            {state.unites.map((u) => (
              <option key={u.id} value={u.id}>{u.nom}</option>
            ))}
          </select>
        </Field>
        <Field label="Affectation / emploi" htmlFor="ag-affectation" error={errors.affectation}>
          <input id="ag-affectation" name="affectation" defaultValue={current?.affectation} className={inputCls} {...err("affectation")} />
        </Field>
        <Field label="Statut d'activité" htmlFor="ag-statut">
          <select id="ag-statut" name="statut" defaultValue={current?.statut ?? "ACTIF"} className={inputCls}>
            {(Object.keys(STATUT_AGENT) as StatutActivite[])
              .filter((s) => s !== "RADIE" || current?.statut === "RADIE")
              .map((s) => (
                <option key={s} value={s}>{STATUT_AGENT[s].label}</option>
              ))}
          </select>
        </Field>
        <Field label="Qualification judiciaire" htmlFor="ag-qualif">
          <select id="ag-qualif" name="qualification" defaultValue={current?.qualification ?? "AUCUNE"} className={inputCls}>
            {(Object.keys(QUALIF_LABEL) as QualifJudiciaire[]).map((q) => (
              <option key={q} value={q}>{q === "AUCUNE" ? "Aucune" : QUALIF_LABEL[q]}</option>
            ))}
          </select>
        </Field>
        <Field label="Rôle applicatif" htmlFor="ag-role">
          <select id="ag-role" name="role" defaultValue={current?.role ?? "AGENT"} className={inputCls}>
            {(["AGENT", "OFFICIER", "ADMIN"] as AuthRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </Field>
        <Field label="Messagerie professionnelle" htmlFor="ag-email" error={errors.email}>
          <input id="ag-email" name="email" type="email" defaultValue={current?.email} className={inputCls} {...err("email")} />
        </Field>
        <Field label="Nom d'utilisateur / Identifiant intranet" hint="Par défaut : matricule" htmlFor="ag-identifiant">
          <input id="ag-identifiant" name="identifiant" defaultValue={current?.identifiant ?? current?.matricule} className={inputCls} placeholder="ex. jdupont ou matricule" />
        </Field>
        <Field label="Mot de passe intranet" hint="Mot de passe d'accès pour l'agent" htmlFor="ag-password">
          <input id="ag-password" name="motDePasse" type="text" defaultValue={current?.motDePasse ?? "Gend2026!"} className={inputCls} />
        </Field>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">{current ? "Enregistrer les modifications" : "Créer l'agent"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RevokeModal({ agent, onClose, onConfirm }: { agent: Agent | null; onClose: () => void; onConfirm: (motif: string) => void }) {
  const [motif, setMotif] = useState("");
  const [confirm, setConfirm] = useState("");
  const ok = motif.trim().length >= 10 && confirm === agent?.matricule;

  return (
    <Modal
      open={agent !== null}
      onClose={() => {
        setMotif("");
        setConfirm("");
        onClose();
      }}
      title="Révoquer un agent"
    >
      {agent && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!ok) return;
            onConfirm(motif.trim());
            setMotif("");
            setConfirm("");
          }}
          className="space-y-4"
        >
          <Alert tone="error" title={`${GRADE_LABEL[agent.grade]} ${agent.prenom} ${agent.nom.toUpperCase()} — Mle ${agent.matricule}`}>
            La révocation désactive immédiatement le compte, invalide toutes les sessions actives et suspend les habilitations en cours.
          </Alert>
          <Field label="Motif de la révocation" hint="Minimum 10 caractères — conservé au dossier et au journal d'audit" htmlFor="rv-motif">
            <textarea id="rv-motif" rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} className={inputCls} />
          </Field>
          <Field label={`Pour confirmer, saisissez le matricule ${agent.matricule}`} htmlFor="rv-confirm">
            <input id="rv-confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputCls} font-mono`} autoComplete="off" />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" variant="danger" disabled={!ok}>
              <Ban size={16} aria-hidden /> Révoquer définitivement
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
