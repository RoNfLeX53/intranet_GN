"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, RotateCcw, Search } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { ProcedureTable } from "@/components/intranet/ProcedureTable";
import { useCurrentUser, useDemo } from "@/components/store";
import { Button, Card, Field, inputCls, Modal, PageHeader } from "@/components/ui";
import { can, canOnResource } from "@/lib/rbac";
import { STATUT_PROCEDURE, TYPE_DOSSIER } from "@/lib/labels";
import type { Classification, ProcedureStatut, TypeDossier } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

const EMPTY = { q: "", matricule: "", type: "", statut: "", from: "", to: "" };

export default function ProceduresPage() {
  return (
    <Guard perm="procedures:read">
      <ProceduresView />
    </Guard>
  );
}

function ProceduresView() {
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;
  const [f, setF] = useState(EMPTY);
  const [creating, setCreating] = useState(false);
  const agentsById = useMemo(() => new Map(state.agents.map((a) => [a.id, a])), [state.agents]);

  const visible = useMemo(
    () => state.procedures.filter((p) => canOnResource(me.subject, "procedures:read", { uniteId: p.uniteId, ownerId: p.redacteurId })),
    [state.procedures, me.subject],
  );

  const results = useMemo(() => {
    const q = f.q.toLowerCase();
    return visible
      .filter((p) => {
        const r = agentsById.get(p.redacteurId);
        if (q && !`${p.numeroPV} ${p.qualification} ${p.lieu}`.toLowerCase().includes(q)) return false;
        if (f.matricule && !r?.matricule.includes(f.matricule)) return false;
        if (f.type && p.type !== f.type) return false;
        if (f.statut && p.statut !== f.statut) return false;
        if (f.from && p.dateFaits.slice(0, 10) < f.from) return false;
        if (f.to && p.dateFaits.slice(0, 10) > f.to) return false;
        return true;
      })
      .sort((a, b) => b.dateFaits.localeCompare(a.dateFaits));
  }, [visible, f, agentsById]);

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <>
      <PageHeader
        title="Procédures judiciaires"
        subtitle={`Périmètre : ${me.unite.nom} — ${visible.length} dossier(s) accessibles`}
        breadcrumb={<>Intranet › Activité opérationnelle › Procédures</>}
        actions={
          can(me.role, "procedures:create") && (
            <Button onClick={() => setCreating(true)}>
              <Plus size={16} aria-hidden /> Nouvelle procédure
            </Button>
          )
        }
      />

      <Card className="mb-6" title="Critères de recherche">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Field label="Mot-clé" hint="N° PV, qualification, lieu" htmlFor="f-q" className="xl:col-span-2">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden />
              <input id="f-q" value={f.q} onChange={set("q")} className={`${inputCls} pl-9`} placeholder="ex. 4512/00341" />
            </div>
          </Field>
          <Field label="Matricule rédacteur" hint="6 chiffres" htmlFor="f-mat">
            <input id="f-mat" value={f.matricule} onChange={set("matricule")} inputMode="numeric" maxLength={6} className={`${inputCls} font-mono`} />
          </Field>
          <Field label="Type de dossier" hint=" " htmlFor="f-type">
            <select id="f-type" value={f.type} onChange={set("type")} className={inputCls}>
              <option value="">Tous</option>
              {Object.entries(TYPE_DOSSIER).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Faits du" hint=" " htmlFor="f-from">
            <input id="f-from" type="date" value={f.from} onChange={set("from")} className={inputCls} />
          </Field>
          <Field label="au" hint=" " htmlFor="f-to">
            <input id="f-to" type="date" value={f.to} onChange={set("to")} className={inputCls} />
          </Field>
          <div className="flex flex-wrap items-center gap-2 md:col-span-3 xl:col-span-6">
            <span className="text-sm font-medium">Statut :</span>
            {[["", "Tous"], ...Object.entries(STATUT_PROCEDURE).map(([k, v]) => [k, v.label])].map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={f.statut === k}
                onClick={() => setF((s) => ({ ...s, statut: k }))}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${f.statut === k ? "border-gend-900 bg-gend-900 text-white" : "border-line bg-white text-ink hover:border-gend-900"}`}
              >
                {label}
              </button>
            ))}
            <Button variant="tertiary" size="sm" className="ml-auto" onClick={() => setF(EMPTY)}>
              <RotateCcw size={14} aria-hidden /> Réinitialiser
            </Button>
          </div>
        </form>
      </Card>

      <Card title={<span aria-live="polite">{results.length} résultat(s)</span>}>
        <div className="-m-5">
          <ProcedureTable procedures={results} caption="Liste des procédures filtrées" />
        </div>
      </Card>

      <NewProcedureModal open={creating} onClose={() => setCreating(false)} onCreate={(p) => dispatch({ type: "PROCEDURE_CREATE", procedure: p })} />
    </>
  );
}

function NewProcedureModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (p: import("@/lib/types").Procedure) => void;
}) {
  const { state } = useDemo();
  const me = useCurrentUser()!;
  const [error, setError] = useState("");

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? "").trim();
    if (!v("qualification") || !v("dateFaits") || !v("lieu") || v("resume").length < 20) {
      setError("Tous les champs sont obligatoires ; le résumé doit comporter au moins 20 caractères.");
      return;
    }
    const seq =
      Math.max(0, ...state.procedures.filter((p) => p.uniteId === me.unite.id).map((p) => Number(p.numeroPV.split("/")[1]))) + 1;
    const now = nowLocal();
    onCreate({
      id: uid(),
      numeroPV: `${me.unite.code}/${String(seq).padStart(5, "0")}/${now.slice(0, 4)}`,
      dateFaits: `${v("dateFaits")}T00:00:00`,
      dateOuverture: now,
      redacteurId: me.agent.id,
      uniteId: me.unite.id,
      type: v("type") as TypeDossier,
      qualification: v("qualification"),
      lieu: v("lieu"),
      resume: v("resume"),
      statut: "OUVERTE" as ProcedureStatut,
      classification: v("classification") as Classification,
      historique: [{ date: now, acteurId: me.agent.id, action: "Ouverture de la procédure" }],
      rapports: [],
    });
    setError("");
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Nouvelle procédure" size="lg">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2" noValidate>
        {error && (
          <p className="text-sm font-medium text-marianne-dark md:col-span-2" role="alert">
            {error}
          </p>
        )}
        <Field label="Type de dossier" htmlFor="n-type">
          <select id="n-type" name="type" className={inputCls} defaultValue="FLAGRANT_DELIT">
            {Object.entries(TYPE_DOSSIER).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="Date des faits" htmlFor="n-date">
          <input id="n-date" name="dateFaits" type="date" className={inputCls} />
        </Field>
        <Field label="Qualification de l'infraction" htmlFor="n-qualif" className="md:col-span-2">
          <input id="n-qualif" name="qualification" className={inputCls} placeholder="ex. Vol simple" />
        </Field>
        <Field label="Lieu des faits" htmlFor="n-lieu">
          <input id="n-lieu" name="lieu" className={inputCls} />
        </Field>
        <Field label="Classification" htmlFor="n-classif">
          <select id="n-classif" name="classification" className={inputCls} defaultValue="DIFFUSION_RESTREINTE">
            <option value="NON_PROTEGE">Non protégé</option>
            <option value="DIFFUSION_RESTREINTE">Diffusion restreinte</option>
          </select>
        </Field>
        <Field label="Résumé des faits" htmlFor="n-resume" className="md:col-span-2">
          <textarea id="n-resume" name="resume" rows={4} className={inputCls} />
        </Field>
        <p className="text-xs text-ink-mute md:col-span-2">
          Rédacteur : {me.agent.prenom} {me.agent.nom.toUpperCase()} ({me.agent.matricule}) · Numéro de PV attribué automatiquement.
        </p>
        <div className="flex justify-end gap-2 md:col-span-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">Créer la procédure</Button>
        </div>
      </form>
    </Modal>
  );
}
