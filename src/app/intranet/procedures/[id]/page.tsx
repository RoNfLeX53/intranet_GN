"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Archive, Calendar, FileText, Gavel, History, Lock, MapPin, Send, User } from "lucide-react";
import { AccessDenied, Guard } from "@/components/intranet/Guard";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, Field, inputCls, Modal, PageHeader } from "@/components/ui";
import { canOnResource } from "@/lib/rbac";
import { GRADE_ABBR, GRADE_LABEL, QUALIF_LABEL, STATUT_PROCEDURE, TYPE_DOSSIER } from "@/lib/labels";
import type { Agent, ProcedureStatut } from "@/lib/types";
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
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;
  const [modal, setModal] = useState<null | "transmettre" | "classer">(null);
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
          <>
            <Badge tone={st.tone} className="px-3 py-1 text-xs">{st.label}</Badge>
            {p.classification === "DIFFUSION_RESTREINTE" && (
              <Badge tone="error" className="px-3 py-1 text-xs">
                <Lock size={12} aria-hidden /> Diffusion restreinte
              </Badge>
            )}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="Fiche de la procédure">
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
            {canReport && <RapportForm onSubmit={(contenu) => dispatch({ type: "PROCEDURE_ADD_RAPPORT", id: p.id, contenu })} />}
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
                  <p className="text-xs text-ink-mute">Action réservée aux OPJ de l&apos;unité. Signature électronique requise en production.</p>
                </div>
              ) : (
                <Alert tone="neutral">
                  {p.statut !== "OUVERTE"
                    ? "Procédure clôturée : aucune action disponible."
                    : "La validation est réservée à un officier de police judiciaire de l'unité."}
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
        onConfirm={(commentaire, parquet) => {
          dispatch({ type: "PROCEDURE_TRANSITION", id: p.id, to: modal === "classer" ? "CLASSEE" : "TRANSMISE_PARQUET", commentaire, parquet });
          setModal(null);
        }}
      />
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

function RapportForm({ onSubmit }: { onSubmit: (contenu: string) => void }) {
  const [value, setValue] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    if (value.trim().length < 10) return;
    onSubmit(value.trim());
    setValue("");
  }
  return (
    <form onSubmit={submit} className="mt-6 border-t border-line pt-5">
      <Field label="Ajouter un rapport / une mention" hint="Minimum 10 caractères. Horodaté et signé de votre matricule." htmlFor="rapport">
        <textarea id="rapport" rows={3} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} />
      </Field>
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={value.trim().length < 10}>Annexer le rapport</Button>
      </div>
    </form>
  );
}

const MOTIFS_CLASSEMENT = ["Absence d'infraction constatée", "Infraction insuffisamment caractérisée", "Auteur non identifié — clôture administrative", "Doublon / erreur de saisie"];

function TransitionModal({ mode, onClose, onConfirm }: { mode: null | "transmettre" | "classer"; onClose: () => void; onConfirm: (commentaire: string, parquet?: string) => void }) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const commentaire = String(fd.get("commentaire") ?? "").trim();
    if (mode === "classer") onConfirm(`${fd.get("motif")}${commentaire ? ` — ${commentaire}` : ""}`);
    else onConfirm(commentaire, String(fd.get("parquet")));
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
              <option>Parquet du TJ de Valmont</option>
              <option>Parquet du TJ de Saint-Aubin (fictif)</option>
            </select>
          </Field>
        )}
        <Field label="Observations (facultatif)" htmlFor="t-comment">
          <textarea id="t-comment" name="commentaire" rows={3} className={inputCls} />
        </Field>
        <Alert tone="warning">Cette décision est définitive dans la maquette et sera inscrite à l&apos;historique et au journal d&apos;audit.</Alert>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">Confirmer</Button>
        </div>
      </form>
    </Modal>
  );
}
