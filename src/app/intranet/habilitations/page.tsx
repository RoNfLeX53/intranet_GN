"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Check, Plus, X } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, EmptyState, Field, inputCls, Modal, PageHeader } from "@/components/ui";
import { can, canReviewHabilitation } from "@/lib/rbac";
import { GRADE_ABBR, HABILITATION_TYPE, STATUT_HABILITATION } from "@/lib/labels";
import type { Agent, DemandeHabilitation, HabilitationType } from "@/lib/types";
import { cx, fmtDate, fmtDateTime, nowLocal, uid } from "@/lib/utils";

export default function HabilitationsPage() {
  return (
    <Guard perm={["habilitations:request", "habilitations:review"]}>
      <HabilitationsView />
    </Guard>
  );
}

type Tab = "mine" | "review" | "history";

function HabilitationsView() {
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;
  const canRequest = can(me.role, "habilitations:request");
  const canReview = can(me.role, "habilitations:review");
  const [tab, setTab] = useState<Tab>(canReview ? "review" : "mine");
  const [creating, setCreating] = useState(false);
  const [deciding, setDeciding] = useState<{ demande: DemandeHabilitation; statut: "VALIDEE" | "REJETEE" } | null>(null);

  const agents = useMemo(() => new Map(state.agents.map((a) => [a.id, a])), [state.agents]);
  const reviewable = (h: DemandeHabilitation) => canReviewHabilitation(me.subject, h, agents.get(h.demandeurId)?.uniteId);

  const lists: Record<Tab, DemandeHabilitation[]> = {
    mine: state.habilitations.filter((h) => h.demandeurId === me.agent.id),
    review: state.habilitations.filter((h) => h.statut === "EN_ATTENTE" && reviewable(h)),
    history: state.habilitations.filter((h) => h.statut !== "EN_ATTENTE" && reviewable(h)),
  };

  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "review", label: "À instruire", show: canReview },
    { key: "mine", label: "Mes demandes", show: canRequest },
    { key: "history", label: "Décisions rendues", show: canReview },
  ];

  return (
    <>
      <PageHeader
        title="Demandes d'habilitation"
        subtitle={
          me.role === "ADMIN" ? "Instruction de l'ensemble des demandes" : me.role === "OFFICIER" ? `Instruction des demandes de l'unité : ${me.unite.nom}` : "Dépôt et suivi de vos demandes d'accès"
        }
        breadcrumb={<>Intranet › Activité opérationnelle › Habilitations</>}
        actions={
          canRequest && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden /> Nouvelle demande
            </Button>
          )
        }
      />

      <div role="tablist" aria-label="Vues des habilitations" className="mb-0 flex gap-1 border-b border-line">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              role="tab"
              type="button"
              id={`tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`panel-${t.key}`}
              onClick={() => setTab(t.key)}
              className={cx(
                "-mb-px border-x border-t px-4 py-2.5 text-sm font-medium",
                tab === t.key ? "border-line border-t-2 border-t-gend-900 bg-white text-gend-900" : "border-transparent text-ink-soft hover:bg-white/60",
              )}
            >
              {t.label} <span className="ml-1 rounded-full bg-surface-alt px-2 text-xs">{lists[t.key].length}</span>
            </button>
          ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="border border-t-0 border-line bg-white">
        {tab === "review" && me.role === "OFFICIER" && (
          <div className="p-4 pb-0">
            <Alert tone="info">Règle des « quatre yeux » : vos propres demandes sont instruites par un autre valideur et n&apos;apparaissent pas ici.</Alert>
          </div>
        )}
        {lists[tab].length === 0 ? (
          <EmptyState>Aucune demande dans cette vue.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {lists[tab].map((h) => (
              <DemandeRow
                key={h.id}
                h={h}
                agents={agents}
                actions={
                  tab === "review" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setDeciding({ demande: h, statut: "VALIDEE" })}>
                        <Check size={14} aria-hidden /> Valider
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setDeciding({ demande: h, statut: "REJETEE" })}>
                        <X size={14} aria-hidden /> Rejeter
                      </Button>
                    </div>
                  )
                }
              />
            ))}
          </ul>
        )}
      </div>

      <NewDemandeModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(type, motif, dureeMois) => {
          const now = nowLocal();
          dispatch({
            type: "HABILITATION_CREATE",
            demande: {
              id: uid(),
              reference: `HAB-${now.slice(0, 4)}-${String(145 + state.habilitations.length).padStart(4, "0")}`,
              demandeurId: me.agent.id,
              type,
              motif,
              dureeMois,
              statut: "EN_ATTENTE",
              createdAt: now,
              historique: [{ date: now, acteurId: me.agent.id, action: "Demande déposée" }],
            },
          });
          setCreating(false);
          setTab("mine");
        }}
      />

      <DecisionModal
        decision={deciding}
        agents={agents}
        onClose={() => setDeciding(null)}
        onConfirm={(commentaire) => {
          if (deciding) dispatch({ type: "HABILITATION_DECIDE", id: deciding.demande.id, statut: deciding.statut, commentaire });
          setDeciding(null);
        }}
      />
    </>
  );
}

function DemandeRow({ h, agents, actions }: { h: DemandeHabilitation; agents: Map<string, Agent>; actions?: React.ReactNode }) {
  const d = agents.get(h.demandeurId);
  const st = STATUT_HABILITATION[h.statut];
  return (
    <li className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-ink-mute">{h.reference}</span>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          <p className="mt-1 font-bold text-gend-900">{HABILITATION_TYPE[h.type]}</p>
          <p className="text-sm text-ink-soft">
            {d ? `${GRADE_ABBR[d.grade]} ${d.prenom} ${d.nom.toUpperCase()} (Mle ${d.matricule})` : "—"} · déposée le {fmtDate(h.createdAt)} · durée{" "}
            {h.dureeMois === 0 ? "permanente" : `${h.dureeMois} mois`}
          </p>
          <p className="mt-2 text-sm text-ink">{h.motif}</p>
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium text-gend-900">Historique ({h.historique.length})</summary>
            <ol className="mt-2 space-y-2 border-l-2 border-gend-200 pl-4">
              {h.historique.map((e, i) => {
                const a = agents.get(e.acteurId);
                return (
                  <li key={i}>
                    <span className="font-medium">{e.action}</span>
                    <span className="text-ink-mute"> — {fmtDateTime(e.date)} · {a ? `${GRADE_ABBR[a.grade]} ${a.nom.toUpperCase()}` : "—"}</span>
                    {e.commentaire && <span className="block text-xs italic text-ink-soft">« {e.commentaire} »</span>}
                  </li>
                );
              })}
            </ol>
          </details>
        </div>
        {actions}
      </div>
    </li>
  );
}

function NewDemandeModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (t: HabilitationType, motif: string, duree: number) => void }) {
  const [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const motif = String(fd.get("motif") ?? "").trim();
    if (motif.length < 20) {
      setError("Le besoin d'en connaître doit être justifié (20 caractères minimum).");
      return;
    }
    setError("");
    onCreate(fd.get("type") as HabilitationType, motif, Number(fd.get("duree")));
  }
  return (
    <Modal open={open} onClose={onClose} title="Nouvelle demande d'habilitation">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Type d'habilitation" htmlFor="h-type">
          <select id="h-type" name="type" className={inputCls}>
            {Object.entries(HABILITATION_TYPE).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Justification du besoin d'en connaître" hint="Référence de procédure, mission, formation suivie…" htmlFor="h-motif" error={error}>
          <textarea id="h-motif" name="motif" rows={4} className={inputCls} {...(error ? { "aria-invalid": true, "aria-describedby": "h-motif-error" } : {})} />
        </Field>
        <Field label="Durée demandée" htmlFor="h-duree">
          <select id="h-duree" name="duree" className={inputCls} defaultValue="6">
            <option value="3">3 mois</option>
            <option value="6">6 mois</option>
            <option value="12">12 mois</option>
            <option value="0">Permanente (qualification OPJ/APJ)</option>
          </select>
        </Field>
        <p className="text-xs text-ink-mute">La demande sera instruite par un officier de votre unité ou par l&apos;administration RH.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">Déposer la demande</Button>
        </div>
      </form>
    </Modal>
  );
}

function DecisionModal({
  decision,
  agents,
  onClose,
  onConfirm,
}: {
  decision: { demande: DemandeHabilitation; statut: "VALIDEE" | "REJETEE" } | null;
  agents: Map<string, Agent>;
  onClose: () => void;
  onConfirm: (commentaire: string) => void;
}) {
  const [comment, setComment] = useState("");
  const reject = decision?.statut === "REJETEE";
  const d = decision && agents.get(decision.demande.demandeurId);
  const valid = !reject || comment.trim().length >= 5;
  return (
    <Modal open={decision !== null} onClose={onClose} title={reject ? "Rejeter la demande" : "Valider la demande"}>
      {decision && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            onConfirm(comment.trim());
            setComment("");
          }}
          className="space-y-4"
        >
          <p className="text-sm">
            <strong>{decision.demande.reference}</strong> — {HABILITATION_TYPE[decision.demande.type]} pour{" "}
            {d ? `${GRADE_ABBR[d.grade]} ${d.prenom} ${d.nom.toUpperCase()}` : "—"}.
          </p>
          <Field label={reject ? "Motif du rejet (obligatoire)" : "Commentaire (facultatif)"} htmlFor="dc-comment">
            <textarea id="dc-comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button type="submit" variant={reject ? "danger" : "primary"} disabled={!valid}>
              {reject ? "Confirmer le rejet" : "Confirmer la validation"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
