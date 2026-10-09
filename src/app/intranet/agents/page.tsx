"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Ban, Building2, Pencil, Scale, Search, Shield, UserPlus } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, EmptyState, Field, inputCls, Modal, PageHeader, Td, Th } from "@/components/ui";
import { can, canOnResource } from "@/lib/rbac";
import {
  GRADE_ABBR,
  GRADE_LABEL,
  GRADES_BY_INSTITUTION,
  INSTITUTION_LABEL,
  QUALIF_LABEL,
  ROLE_LABEL,
  STATUT_AGENT,
} from "@/lib/labels";
import type { Agent, AuthRole, Grade, Institution, QualifJudiciaire, StatutActivite } from "@/lib/types";
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
  const [institution, setInstitution] = useState<string>("ALL");
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
      .filter((a) => {
        const agentInst = a.institution || "GENDARMERIE";
        if (institution !== "ALL" && agentInst !== institution) return false;
        if (unite && a.uniteId !== unite) return false;
        if (statut && a.statut !== statut) return false;
        if (s && !`${a.matricule} ${a.nom} ${a.prenom} ${a.affectation}`.toLowerCase().includes(s)) return false;
        return true;
      })
      .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
  }, [state.agents, me.subject, q, unite, institution, statut]);

  return (
    <>
      <PageHeader
        title="Effectifs & annuaire des personnels"
        subtitle={
          isAdmin
            ? `Gestion complète des personnels (Gendarmerie & Police Nationale) — ${rows.length} agent(s) répertorié(s)`
            : `Consultation opérationnelle : ${me.unite.nom}`
        }
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
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-4 md:grid-cols-4">
          <Field label="Rechercher" hint="Matricule, RIO, nom, prénom ou affectation" htmlFor="a-q" className="md:col-span-1">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden />
              <input id="a-q" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} pl-9`} placeholder="ex. 245781..." />
            </div>
          </Field>

          <Field label="Force / Institution" htmlFor="a-inst">
            <select id="a-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} className={inputCls}>
              <option value="ALL">Toutes les forces & juridictions</option>
              <option value="GENDARMERIE">Gendarmerie nationale</option>
              <option value="POLICE_NATIONALE">Police nationale</option>
              <option value="JUSTICE">Justice & Juridictions</option>
            </select>
          </Field>

          <Field label="Unité / Juridiction" htmlFor="a-unite">
            <select id="a-unite" value={unite} onChange={(e) => setUnite(e.target.value)} className={inputCls} disabled={!isAdmin}>
              <option value="">Toutes les unités</option>
              {state.unites.map((u) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          </Field>

          <Field label="Statut d'activité" htmlFor="a-statut">
            <select id="a-statut" value={statut} onChange={(e) => setStatut(e.target.value)} className={inputCls}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_AGENT).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </Field>
        </form>
      </Card>

      <Card title={<span aria-live="polite">{rows.length} agent(s) / personnel(s)</span>}>
        <div className="-m-5 overflow-x-auto">
          {rows.length === 0 ? (
            <EmptyState>Aucun personnel ne correspond aux critères de recherche.</EmptyState>
          ) : (
            <table className="w-full border-collapse">
              <caption className="sr-only">Annuaire des personnels</caption>
              <thead className="border-b-2 border-gend-900 bg-surface">
                <tr>
                  <Th>Matricule / Force</Th>
                  <Th>Personnel</Th>
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
                  const isPN = a.institution === "POLICE_NATIONALE";
                  const isJustice = a.institution === "JUSTICE";

                  return (
                    <tr key={a.id} className={i % 2 ? "bg-surface/60" : undefined}>
                      <Td className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isJustice
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : isPN
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : "bg-gend-100 text-gend-900 border border-gend-300"
                            }`}
                          >
                            {isJustice ? <Scale size={10} /> : isPN ? <Building2 size={10} /> : <Shield size={10} />}
                            {isJustice ? "Justice" : isPN ? "Police" : "Gend"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-gend-900">{a.matricule}</span>
                      </Td>
                      <Td>
                        <span className="font-bold">{a.nom.toUpperCase()}</span> {a.prenom}
                        <span className="block text-xs text-ink-mute">
                          {GRADE_LABEL[a.grade]} ({GRADE_ABBR[a.grade]}) · incorporé le {fmtDate(a.dateIncorporation)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium text-sm text-ink">{u?.nom}</span>
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
                            {(["AGENT", "OFFICIER", "MAGISTRAT", "AVOCAT", "ADMIN"] as AuthRole[]).map((r) => (
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

  const [formInstitution, setFormInstitution] = useState<Institution>(current?.institution || "GENDARMERIE");
  const [selectedGrade, setSelectedGrade] = useState<Grade>(
    current?.grade || (formInstitution === "POLICE_NATIONALE" ? "GARDIEN_DE_LA_PAIX" : "GENDARME")
  );

  function handleInstitutionChange(newInst: Institution) {
    setFormInstitution(newInst);
    const firstGrade =
      newInst === "JUSTICE"
        ? "PROCUREUR"
        : newInst === "POLICE_NATIONALE"
        ? "GARDIEN_DE_LA_PAIX"
        : "GENDARME";
    setSelectedGrade(firstGrade);
  }

  const availableUnites = useMemo(() => {
    return state.unites.filter((u) => !u.institution || u.institution === formInstitution);
  }, [state.unites, formInstitution]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    const errs: Record<string, string> = {};

    // 6 chiffres pour Gendarmerie, 6-7 pour Police (RIO), 4-12 pour Justice
    if (formInstitution === "JUSTICE") {
      if (v("matricule").length < 4) errs.matricule = "La référence / identifiant comporte au moins 4 caractères.";
    } else if (!/^\d{6,7}$/.test(v("matricule"))) {
      errs.matricule = formInstitution === "POLICE_NATIONALE" ? "Le RIO ou matricule comporte 6 ou 7 chiffres." : "Le matricule comporte 6 chiffres.";
    } else if (state.agents.some((a) => a.matricule === v("matricule") && a.id !== current?.id)) {
      errs.matricule = "Ce matricule / identifiant est déjà attribué.";
    }

    if (v("nom").length < 2) errs.nom = "Nom obligatoire.";
    if (v("prenom").length < 2) errs.prenom = "Prénom obligatoire.";
    if (!v("affectation")) errs.affectation = "Affectation obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("email"))) errs.email = "Adresse électronique invalide.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    onSave({
      ...(current ?? { id: uid(), dateIncorporation: new Date().toISOString().slice(0, 10) }),
      matricule: v("matricule"),
      institution: formInstitution,
      nom: v("nom"),
      prenom: v("prenom"),
      grade: selectedGrade,
      uniteId: v("uniteId"),
      affectation: v("affectation"),
      statut: v("statut") as StatutActivite,
      qualification: v("qualification") as QualifJudiciaire,
      role: v("role") as AuthRole,
      email: v("email"),
      identifiant: v("identifiant") || v("matricule"),
      motDePasse:
        v("motDePasse") ||
        (formInstitution === "JUSTICE" ? "Justice2026!" : formInstitution === "POLICE_NATIONALE" ? "Police2026!" : "Gend2026!"),
    } as Agent);
  }

  const err = (k: string) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `ag-${k}-error` } : {});

  return (
    <Modal open={agent !== null} onClose={onClose} title={current ? `Modifier le personnel ${current.matricule}` : "Ajouter un personnel (GN / PN / Justice)"} size="lg">
      <form key={current?.id ?? "new"} onSubmit={submit} noValidate className="grid gap-4 md:grid-cols-2">
        {/* Choix institution */}
        <div className="md:col-span-2 rounded border border-line bg-surface p-3">
          <label className="block text-xs font-bold uppercase text-ink-mute mb-2">
            Corps d&apos;appartenance / Institution
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleInstitutionChange("GENDARMERIE")}
              className={`flex items-center justify-center gap-2 rounded border p-2.5 text-xs font-bold transition-all ${
                formInstitution === "GENDARMERIE"
                  ? "border-gend-900 bg-gend-900 text-white shadow-sm"
                  : "border-line bg-white text-ink hover:border-gend-900"
              }`}
            >
              <Shield size={14} /> Gendarmerie
            </button>
            <button
              type="button"
              onClick={() => handleInstitutionChange("POLICE_NATIONALE")}
              className={`flex items-center justify-center gap-2 rounded border p-2.5 text-xs font-bold transition-all ${
                formInstitution === "POLICE_NATIONALE"
                  ? "border-gend-900 bg-gend-900 text-white shadow-sm"
                  : "border-line bg-white text-ink hover:border-gend-900"
              }`}
            >
              <Building2 size={14} /> Police nationale
            </button>
            <button
              type="button"
              onClick={() => handleInstitutionChange("JUSTICE")}
              className={`flex items-center justify-center gap-2 rounded border p-2.5 text-xs font-bold transition-all ${
                formInstitution === "JUSTICE"
                  ? "border-gend-900 bg-gend-900 text-white shadow-sm"
                  : "border-line bg-white text-ink hover:border-gend-900"
              }`}
            >
              <Scale size={14} /> Justice / Tribunal
            </button>
          </div>
        </div>

        <Field
          label={
            formInstitution === "JUSTICE"
              ? "N° de Magistrat ou CNBF / Toque"
              : formInstitution === "POLICE_NATIONALE"
              ? "RIO ou Matricule Police"
              : "Matricule Gendarmerie"
          }
          hint={formInstitution === "JUSTICE" ? "Ex: MAG-4512 ou CNBF-84210" : formInstitution === "POLICE_NATIONALE" ? "6 ou 7 chiffres" : "6 chiffres"}
          htmlFor="ag-matricule"
          error={errors.matricule}
        >
          <input
            id="ag-matricule"
            name="matricule"
            defaultValue={current?.matricule}
            maxLength={formInstitution === "JUSTICE" ? 12 : formInstitution === "POLICE_NATIONALE" ? 7 : 6}
            className={`${inputCls} font-mono`}
            {...err("matricule")}
          />
        </Field>

        <Field label={`Titre / Grade (${INSTITUTION_LABEL[formInstitution]})`} htmlFor="ag-grade">
          <select
            id="ag-grade"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value as Grade)}
            className={inputCls}
          >
            {GRADES_BY_INSTITUTION[formInstitution].map((g) => (
              <option key={g} value={g}>
                {GRADE_LABEL[g]} ({GRADE_ABBR[g]})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nom de famille" htmlFor="ag-nom" error={errors.nom}>
          <input id="ag-nom" name="nom" defaultValue={current?.nom} className={inputCls} {...err("nom")} />
        </Field>

        <Field label="Prénom" htmlFor="ag-prenom" error={errors.prenom}>
          <input id="ag-prenom" name="prenom" defaultValue={current?.prenom} className={inputCls} {...err("prenom")} />
        </Field>

        <Field label="Unité / Juridiction / Service" htmlFor="ag-unite">
          <select id="ag-unite" name="uniteId" defaultValue={current?.uniteId ?? availableUnites[0]?.id ?? "u1"} className={inputCls}>
            {availableUnites.map((u) => (
              <option key={u.id} value={u.id}>{u.nom} (code {u.code})</option>
            ))}
          </select>
        </Field>

        <Field label="Affectation / Fonction" htmlFor="ag-affectation" error={errors.affectation}>
          <input id="ag-affectation" name="affectation" defaultValue={current?.affectation} className={inputCls} placeholder="ex. Parquet, Cabinet 1, Enquêteur..." {...err("affectation")} />
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
          <select id="ag-role" name="role" defaultValue={current?.role ?? (formInstitution === "JUSTICE" ? "MAGISTRAT" : "AGENT")} className={inputCls}>
            {(["AGENT", "OFFICIER", "MAGISTRAT", "AVOCAT", "ADMIN"] as AuthRole[]).map((r) => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
        </Field>

        <Field label="Messagerie professionnelle" htmlFor="ag-email" error={errors.email}>
          <input
            id="ag-email"
            name="email"
            type="email"
            defaultValue={
              current?.email ??
              (formInstitution === "JUSTICE"
                ? "magistrat@justice.gouv.fr"
                : formInstitution === "POLICE_NATIONALE"
                ? "agent@police.interieur.gouv.fr"
                : "agent@gendarmerie.interieur.gouv.fr")
            }
            className={inputCls}
            {...err("email")}
          />
        </Field>

        <Field label="Nom d'utilisateur / Identifiant" hint="Par défaut : matricule" htmlFor="ag-identifiant">
          <input id="ag-identifiant" name="identifiant" defaultValue={current?.identifiant ?? current?.matricule} className={inputCls} placeholder="ex. matricule" />
        </Field>

        <Field label="Mot de passe intranet" hint="Mot de passe d'accès pour l'agent" htmlFor="ag-password">
          <input
            id="ag-password"
            name="motDePasse"
            type="text"
            defaultValue={current?.motDePasse ?? (formInstitution === "POLICE_NATIONALE" ? "Police2026!" : "Gend2026!")}
            className={inputCls}
          />
        </Field>

        <div className="flex justify-end gap-2 md:col-span-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">{current ? "Enregistrer les modifications" : "Créer le personnel"}</Button>
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
