"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Archive,
  Calendar,
  Eye,
  FileCheck2,
  FileText,
  Gavel,
  History,
  Lock,
  MapPin,
  Pencil,
  Send,
  Trash2,
  User,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { AccessDenied, Guard } from "@/components/intranet/Guard";
import { AuditionModal } from "@/components/intranet/AuditionModal";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, Field, inputCls, Modal, PageHeader } from "@/components/ui";
import { can, canOnResource } from "@/lib/rbac";
import {
  GRADE_ABBR,
  GRADE_LABEL,
  QUALIF_LABEL,
  STATUT_PROCEDURE,
  TYPE_AUDITION,
  TYPE_DOSSIER,
} from "@/lib/labels";
import type { Agent, Audition, Classification, Procedure, ProcedureStatut, TypeDossier } from "@/lib/types";
import { cx, fmtDate, fmtDateTime } from "@/lib/utils";

export default function ProcedureDetailPage() {
  return (
    <Guard perm="procedures:read">
      <ProcedureDetail />
    </Guard>
  );
}

const STEPS: { key: ProcedureStatut; label: string }[] = [
  { key: "OUVERTE", label: "Ouverte" },
  { key: "TRANSMISE_PARQUET", label: "Transmise au parquet" },
];

function agentLabel(a?: Agent) {
  return a ? `${GRADE_ABBR[a.grade]} ${a.prenom} ${a.nom.toUpperCase()}` : "—";
}

function ProcedureDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;
  const [modal, setModal] = useState<null | "transmettre" | "classer">(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [auditionModalOpen, setAuditionModalOpen] = useState(false);
  const [selectedAudition, setSelectedAudition] = useState<Audition | null>(null);
  const logged = useRef(false);

  const p = state.procedures.find((x) => x.id === id);
  const allowed = !!p && canOnResource(me.subject, "procedures:read", { uniteId: p.uniteId, ownerId: p.redacteurId });

  // Traçabilité : toute consultation d'un dossier est journalisée.
  useEffect(() => {
    if (allowed && !logged.current) {
      logged.current = true;
      dispatch({ type: "PROCEDURE_VIEW", id });
    }
  }, [allowed, id, dispatch]);

  if (!p) return <AccessDenied reason="Cette procédure n'existe pas ou a été supprimée." />;
  if (!allowed) return <AccessDenied reason="Cette procédure relève d'une autre unité : le besoin d'en connaître n'est pas établi." />;

  const agents = new Map(state.agents.map((a) => [a.id, a]));
  const redacteur = agents.get(p.redacteurId);
  const unite = state.unites.find((u) => u.id === p.uniteId);
  const st = STATUT_PROCEDURE[p.statut];
  const canValidate = p.statut === "OUVERTE" && canOnResource(me.subject, "procedures:validate", { uniteId: p.uniteId });
  const canReport = p.statut === "OUVERTE" && canOnResource(me.subject, "procedures:rapport", { uniteId: p.uniteId });
  const canEditOrDelete = can(me.role, "procedures:create") || canValidate || me.agent.id === p.redacteurId;

  return (
    <>
      <PageHeader
        title={`PV n° ${p.numeroPV}`}
        subtitle={p.qualification}
        breadcrumb={
          <>
            <Link href="/intranet/procedures" className="underline-offset-2 hover:underline">Procédures</Link> › {p.numeroPV}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={st.tone} className="px-3 py-1 text-xs">{st.label}</Badge>
            {p.classification === "DIFFUSION_RESTREINTE" && (
              <Badge tone="error" className="px-3 py-1 text-xs">
                <Lock size={12} aria-hidden /> Diffusion restreinte
              </Badge>
            )}

            {canEditOrDelete && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  icon={<Pencil size={14} />}
                >
                  Modifier
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="border-marianne-dark text-marianne-dark hover:bg-marianne-dark/5"
                  onClick={() => setDeleteModalOpen(true)}
                  icon={<Trash2 size={14} />}
                >
                  Supprimer
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card
            title="Fiche de la procédure"
            actions={
              canEditOrDelete && (
                <Button variant="tertiary" size="sm" onClick={() => setEditModalOpen(true)} icon={<Pencil size={13} />}>
                  Modifier
                </Button>
              )
            }
          >
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <Info icon={<FileText size={16} />} label="Type de dossier" value={TYPE_DOSSIER[p.type]} />
              <Info icon={<Gavel size={16} />} label="Qualification de l'infraction" value={p.qualification} />
              <Info icon={<Calendar size={16} />} label="Date des faits" value={fmtDateTime(p.dateFaits)} />
              <Info icon={<Calendar size={16} />} label="Ouverture de la procédure" value={fmtDateTime(p.dateOuverture)} />
              <Info
                icon={<User size={16} />}
                label="Rédacteur"
                value={
                  redacteur ? (
                    <>
                      {GRADE_LABEL[redacteur.grade]} {redacteur.prenom} {redacteur.nom.toUpperCase()}
                      <span className="block font-mono text-xs text-ink-mute">
                        Mle {redacteur.matricule} · {QUALIF_LABEL[redacteur.qualification]}
                      </span>
                    </>
                  ) : (
                    "—"
                  )
                }
              />
              <Info icon={<MapPin size={16} />} label="Lieu des faits" value={p.lieu} />
              <Info label="Unité saisie" value={unite ? `${unite.nom} (${unite.code})` : "—"} />
              <Info label="OPJ valideur / Parquet" value={p.valideParId ? `${agentLabel(agents.get(p.valideParId))} — ${p.parquet ?? "—"}` : "Non transmise"} />
            </dl>
          </Card>

          <Card title="Exposé des faits">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{p.resume}</p>
          </Card>

          {/* Procès-verbaux d'auditions & dépositions */}
          <Card
            title={`Auditions judiciaires & dépositions (${(state.auditions || []).filter((a) => a.procedureId === p.id).length})`}
            actions={
              p.statut === "OUVERTE" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedAudition(null);
                    setAuditionModalOpen(true);
                  }}
                  icon={<UserCheck size={14} />}
                >
                  Prendre une déposition / audition
                </Button>
              )
            }
          >
            {(state.auditions || []).filter((a) => a.procedureId === p.id).length === 0 ? (
              <p className="text-sm text-ink-mute">
                Aucune audition recueillie pour le moment. Vous pouvez enregistrer la déposition de plainte de la victime ou l&apos;audition d&apos;un témoin/suspect.
              </p>
            ) : (
              <div className="divide-y divide-line">
                {(state.auditions || [])
                  .filter((a) => a.procedureId === p.id)
                  .map((a) => {
                    const typeInfo = TYPE_AUDITION[a.typeAudition];
                    return (
                      <div
                        key={a.id}
                        className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-gend-900">{a.numeroPV}</span>
                            <Badge tone={typeInfo.tone}>{typeInfo.label.split("(")[0]}</Badge>
                          </div>
                          <p className="mt-1 text-sm font-bold text-ink">
                            {a.prenom} {a.nom.toUpperCase()} {a.profession ? `(${a.profession})` : ""}
                          </p>
                          <p className="text-xs text-ink-mute">
                            Entendu(e) le {fmtDateTime(a.dateDebut)} par {a.enqueteurGrade} {a.enqueteurNom} ({a.enqueteurQualif})
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={<Eye size={14} />}
                            onClick={() => {
                              setSelectedAudition(a);
                              setAuditionModalOpen(true);
                            }}
                          >
                            Consulter le PV
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>

          <Card title={`Rapports et procès-verbaux annexés (${p.rapports.length})`}>
            {p.rapports.length === 0 && <p className="text-sm text-ink-mute">Aucun rapport annexé.</p>}
            <ol className="space-y-4">
              {p.rapports.map((r, i) => (
                <li key={r.id} className="border-l-4 border-gend-200 pl-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-mute">
                    Pièce n° {i + 1} · {fmtDateTime(r.date)} · {agentLabel(agents.get(r.auteurId))}
                  </p>
                  <p className="mt-1 text-sm text-ink">{r.contenu}</p>
                </li>
              ))}
            </ol>
            {canReport && (
              <RapportForm
                procedureId={p.id}
                auteurId={me.agent.id}
                onSubmit={async (contenu) => {
                  try {
                    await fetch(`/api/procedures/${p.id}/rapports`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ auteurId: me.agent.id, contenu }),
                    });
                  } catch (e) {
                    console.error("Erreur enregistrement rapport:", e);
                  }
                  dispatch({ type: "PROCEDURE_ADD_RAPPORT", id: p.id, contenu });
                }}
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Workflow de la procédure">
            <ol className="space-y-0">
              {(p.statut === "CLASSEE" ? [STEPS[0], { key: "CLASSEE" as const, label: "Classée" }] : STEPS).map((s, i, arr) => {
                const reached = arr.findIndex((x) => x.key === p.statut) >= i;
                return (
                  <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
                    {i < arr.length - 1 && <span className={cx("absolute left-[11px] top-6 h-full w-0.5", reached ? "bg-gend-900" : "bg-line")} aria-hidden />}
                    <span
                      className={cx(
                        "z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        reached ? (s.key === "CLASSEE" ? "bg-ink-mute text-white" : "bg-gend-900 text-white") : "border-2 border-line bg-white text-ink-mute",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className={cx("text-sm", reached ? "font-bold text-ink" : "text-ink-mute")}>
                      {s.label}
                      {s.key === p.statut && <span className="sr-only"> (étape actuelle)</span>}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5 border-t border-line pt-5">
              {canValidate ? (
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setModal("transmettre")}>
                    <Send size={16} aria-hidden /> Valider et transmettre au parquet
                  </Button>
                  <Button variant="secondary" onClick={() => setModal("classer")}>
                    <Archive size={16} aria-hidden /> Classer la procédure
                  </Button>
                  <p className="text-xs text-ink-mute">Action réservée aux OPJ de l&apos;unité. Signature électronique consignée en base de données.</p>
                </div>
              ) : (
                <Alert tone="neutral">
                  {p.statut !== "OUVERTE"
                    ? "Procédure clôturée : statut figé."
                    : "La validation et transmission au parquet est réservée à un officier de police judiciaire (OPJ)."}
                </Alert>
              )}
            </div>
          </Card>

          <Card title={<span className="flex items-center gap-2"><History size={16} aria-hidden /> Historique</span>}>
            <ol className="space-y-4">
              {[...p.historique].reverse().map((h, i) => (
                <li key={i} className="border-l-2 border-gend-900 pl-3">
                  <p className="text-sm font-bold text-ink">{h.action}</p>
                  <p className="text-xs text-ink-mute">
                    {fmtDateTime(h.date)} · {agentLabel(agents.get(h.acteurId))}
                  </p>
                  {h.commentaire && <p className="mt-1 text-xs italic text-ink-soft">« {h.commentaire} »</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>

      <TransitionModal
        mode={modal}
        onClose={() => setModal(null)}
        onConfirm={async (commentaire, parquet) => {
          const nextStatut = modal === "classer" ? "CLASSEE" : "TRANSMISE_PARQUET";
          try {
            await fetch(`/api/procedures/${p.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                statut: nextStatut,
                valideParId: modal === "transmettre" ? me.agent.id : undefined,
                parquet: parquet || undefined,
                commentaire,
                acteurId: me.agent.id,
              }),
            });
          } catch (e) {
            console.error("Erreur transition procédure BD:", e);
          }
          dispatch({ type: "PROCEDURE_TRANSITION", id: p.id, to: nextStatut, commentaire, parquet });
          setModal(null);
        }}
      />

      {editModalOpen && (
        <EditProcedureModal
          procedure={p}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={async (updates, commentaire) => {
            try {
              await fetch(`/api/procedures/${p.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...updates,
                  commentaire,
                  acteurId: me.agent.id,
                }),
              });
            } catch (e) {
              console.error("Erreur mise à jour procédure BD:", e);
            }
            dispatch({ type: "PROCEDURE_UPDATE", id: p.id, updates, commentaire });
            setEditModalOpen(false);
          }}
        />
      )}

      {deleteModalOpen && (
        <DeleteProcedureModal
          procedure={p}
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onDelete={async (motif) => {
            try {
              await fetch(`/api/procedures/${p.id}`, {
                method: "DELETE",
              });
            } catch (e) {
              console.error("Erreur suppression procédure BD:", e);
            }
            dispatch({ type: "PROCEDURE_DELETE", id: p.id, motif });
            setDeleteModalOpen(false);
            router.push("/intranet/procedures");
          }}
        />
      )}

      {auditionModalOpen && (
        <AuditionModal
          procedure={p}
          initialData={selectedAudition || undefined}
          open={auditionModalOpen}
          onClose={() => {
            setAuditionModalOpen(false);
            setSelectedAudition(null);
          }}
        />
      )}
    </>
  );
}

function Info({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-mute">
        {icon && <span aria-hidden>{icon}</span>}
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

function RapportForm({
  procedureId,
  auteurId,
  onSubmit,
}: {
  procedureId: string;
  auteurId: string;
  onSubmit: (contenu: string) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (value.trim().length < 10) return;
    setSubmitting(true);
    await onSubmit(value.trim());
    setValue("");
    setSubmitting(false);
  }

  return (
    <form onSubmit={submit} className="mt-6 border-t border-line pt-5">
      <Field label="Ajouter un rapport / une mention" hint="Minimum 10 caractères. Horodaté et signé de votre matricule." htmlFor="rapport">
        <textarea id="rapport" rows={3} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} placeholder="Compte-rendu d'investigation, constatation complémentaire, réquisition..." />
      </Field>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={value.trim().length < 10 || submitting}>
          {submitting ? "Enregistrement..." : "Annexer le rapport"}
        </Button>
      </div>
    </form>
  );
}

const MOTIFS_CLASSEMENT = [
  "Absence d'infraction constatée",
  "Infraction insuffisamment caractérisée",
  "Auteur non identifié — clôture administrative",
  "Doublon / erreur de saisie",
];

function TransitionModal({
  mode,
  onClose,
  onConfirm,
}: {
  mode: null | "transmettre" | "classer";
  onClose: () => void;
  onConfirm: (commentaire: string, parquet?: string) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const commentaire = String(fd.get("commentaire") ?? "").trim();
    if (mode === "classer") {
      await onConfirm(`${fd.get("motif")}${commentaire ? ` — ${commentaire}` : ""}`);
    } else {
      await onConfirm(commentaire, String(fd.get("parquet")));
    }
    setLoading(false);
  }

  return (
    <Modal open={mode !== null} onClose={onClose} title={mode === "classer" ? "Classer la procédure" : "Valider et transmettre au parquet"}>
      <form onSubmit={submit} className="space-y-4">
        {mode === "classer" ? (
          <Field label="Motif de classement" htmlFor="t-motif">
            <select id="t-motif" name="motif" className={inputCls}>
              {MOTIFS_CLASSEMENT.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Parquet destinataire" htmlFor="t-parquet">
            <select id="t-parquet" name="parquet" className={inputCls}>
              <option>Parquet du Tribunal Judiciaire de proximité</option>
              <option>Parquet du Tribunal Judiciaire de Nanterre</option>
              <option>Parquet du Tribunal Judiciaire de Paris</option>
              <option>Parquet du Tribunal Judiciaire de Bobigny</option>
            </select>
          </Field>
        )}
        <Field label="Observations (facultatif)" htmlFor="t-comment">
          <textarea id="t-comment" name="commentaire" rows={3} className={inputCls} />
        </Field>
        <Alert tone="warning">Cette décision est formelle et sera immédiatement inscrite à l&apos;historique de la procédure et au journal d&apos;audit.</Alert>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button type="submit" disabled={loading}>{loading ? "Traitement..." : "Confirmer"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function EditProcedureModal({
  procedure,
  open,
  onClose,
  onUpdate,
}: {
  procedure: Procedure;
  open: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<Procedure>, commentaire?: string) => Promise<void> | void;
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();

    if (!v("qualification") || !v("dateFaits") || !v("lieu") || v("resume").length < 20) {
      setError("Tous les champs sont requis ; le résumé doit comporter au moins 20 caractères.");
      return;
    }

    setLoading(true);
    const updates: Partial<Procedure> = {
      type: v("type") as TypeDossier,
      qualification: v("qualification"),
      lieu: v("lieu"),
      dateFaits: `${v("dateFaits")}T00:00:00`,
      classification: v("classification") as Classification,
      resume: v("resume"),
    };

    const motifModif = v("motifModif") || "Mise à jour des éléments de la procédure";
    await onUpdate(updates, motifModif);
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Modifier la procédure ${procedure.numeroPV}`} size="lg">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2" noValidate>
        {error && (
          <p className="text-sm font-medium text-marianne-dark md:col-span-2" role="alert">
            {error}
          </p>
        )}
        <Field label="Cadre d'enquête (type de dossier)" htmlFor="e-type">
          <select id="e-type" name="type" className={inputCls} defaultValue={procedure.type}>
            {Object.entries(TYPE_DOSSIER).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Date des faits" htmlFor="e-date">
          <input
            id="e-date"
            name="dateFaits"
            type="date"
            className={inputCls}
            defaultValue={procedure.dateFaits.slice(0, 10)}
          />
        </Field>
        <Field label="Qualification de l'infraction" htmlFor="e-qualif" className="md:col-span-2">
          <input
            id="e-qualif"
            name="qualification"
            className={inputCls}
            defaultValue={procedure.qualification}
          />
        </Field>
        <Field label="Lieu des faits" htmlFor="e-lieu">
          <input id="e-lieu" name="lieu" className={inputCls} defaultValue={procedure.lieu} />
        </Field>
        <Field label="Classification" htmlFor="e-classif">
          <select id="e-classif" name="classification" className={inputCls} defaultValue={procedure.classification}>
            <option value="NON_PROTEGE">Non protégé</option>
            <option value="DIFFUSION_RESTREINTE">Diffusion restreinte</option>
          </select>
        </Field>
        <Field label="Exposé des faits" htmlFor="e-resume" className="md:col-span-2">
          <textarea id="e-resume" name="resume" rows={4} className={inputCls} defaultValue={procedure.resume} />
        </Field>
        <Field label="Motif de la modification (traçabilité)" htmlFor="e-motif" className="md:col-span-2" hint="Explication consignée dans l'historique et l'audit réglementaire.">
          <input
            id="e-motif"
            name="motifModif"
            className={inputCls}
            placeholder="ex. Requalification des faits suite à l'audition de la victime, précision du lieu..."
          />
        </Field>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteProcedureModal({
  procedure,
  open,
  onClose,
  onDelete,
}: {
  procedure: Procedure;
  open: boolean;
  onClose: () => void;
  onDelete: (motif: string) => Promise<void> | void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [motif, setMotif] = useState("Erreur matérielle de saisie / Annulation");
  const [loading, setLoading] = useState(false);
  const match = confirmText.trim() === procedure.numeroPV.trim();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!match) return;
    setLoading(true);
    await onDelete(motif);
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Suppression de la procédure judiciaire" size="md">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-start gap-3 rounded border border-marianne-dark/30 bg-marianne-dark/10 p-3 text-sm text-marianne-dark">
          <AlertTriangle size={20} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Attention : Cette action est irréversible.</p>
            <p className="text-xs">
              La suppression de cette procédure effacera définitivement le dossier, ainsi que toutes les dépositions, procès-verbaux d&apos;auditions et rapports annexés.
            </p>
          </div>
        </div>

        <Field label="Motif de suppression" htmlFor="del-motif">
          <select
            id="del-motif"
            className={inputCls}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
          >
            <option value="Erreur matérielle de saisie / Annulation">Erreur matérielle de saisie / Annulation</option>
            <option value="Doublon technique de procédure">Doublon technique de procédure</option>
            <option value="Dossier créé par test opérationnel">Dossier créé par test opérationnel</option>
            <option value="Ordonnance ou décision de non-lieu de l'autorité judiciaire">Décision de l&apos;autorité judiciaire</option>
          </select>
        </Field>

        <Field
          label={`Pour confirmer, veuillez saisir le numéro de PV : ${procedure.numeroPV}`}
          htmlFor="del-confirm"
          hint="Respectez la casse et les séparateurs."
        >
          <input
            id="del-confirm"
            className={`${inputCls} font-mono`}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={procedure.numeroPV}
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            type="submit"
            className="bg-marianne-dark text-white hover:bg-marianne-dark/90"
            disabled={!match || loading}
          >
            {loading ? "Suppression en cours..." : "Supprimer définitivement la procédure"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
