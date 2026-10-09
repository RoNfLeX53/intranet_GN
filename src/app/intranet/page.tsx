"use client";

import Link from "next/link";
import { ArrowRight, FileText, KeyRound, ScrollText, UserPlus, Users } from "lucide-react";
import { ProcedureTable } from "@/components/intranet/ProcedureTable";
import { useCurrentUser, useDemo } from "@/components/store";
import { Badge, Card, Kpi, PageHeader } from "@/components/ui";
import { can, canOnResource, canReviewHabilitation } from "@/lib/rbac";
import { ETAPE_CANDIDATURE, ETAPES_CANDIDATURE, GRADE_ABBR, HABILITATION_TYPE, ROLE_LABEL, STATUT_HABILITATION } from "@/lib/labels";
import { fmtDate, fmtDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const { state } = useDemo();
  const me = useCurrentUser();
  if (!me) return null;

  const agentsById = new Map(state.agents.map((a) => [a.id, a]));
  const procs = state.procedures
    .filter((p) => canOnResource(me.subject, "procedures:read", { uniteId: p.uniteId, ownerId: p.redacteurId }))
    .sort((a, b) => b.dateOuverture.localeCompare(a.dateOuverture));
  const toReview = state.habilitations.filter(
    (h) => h.statut === "EN_ATTENTE" && canReviewHabilitation(me.subject, h, agentsById.get(h.demandeurId)?.uniteId),
  );
  const mine = state.habilitations.filter((h) => h.demandeurId === me.agent.id);
  const unitAgents = state.agents.filter((a) => a.uniteId === me.agent.uniteId && a.statut !== "RADIE");
  const pendingPrePlaintes = (state.prePlaintes ?? []).filter(
    (p) => p.statut === "DEPOSEE" && (me.role === "ADMIN" || p.uniteId === me.unite.id)
  );

  const kpis =
    me.role === "AGENT"
      ? [
          { label: "Mes procédures ouvertes", value: procs.filter((p) => p.redacteurId === me.agent.id && p.statut === "OUVERTE").length, icon: <FileText size={20} />, hint: "dont je suis rédacteur" },
          { label: "Procédures de l'unité", value: procs.length, icon: <FileText size={20} />, hint: me.unite.nom },
          { label: "Mes habilitations en attente", value: mine.filter((h) => h.statut === "EN_ATTENTE").length, icon: <KeyRound size={20} />, accent: "red" as const },
          { label: "Habilitations actives", value: mine.filter((h) => h.statut === "VALIDEE").length, icon: <KeyRound size={20} /> },
        ]
      : me.role === "OFFICIER"
        ? [
            { label: "Procédures à valider", value: procs.filter((p) => p.statut === "OUVERTE").length, icon: <FileText size={20} />, accent: "red" as const, hint: "statut « ouverte »" },
            { label: "Transmises au parquet", value: procs.filter((p) => p.statut === "TRANSMISE_PARQUET").length, icon: <FileText size={20} /> },
            { label: "Habilitations à instruire", value: toReview.length, icon: <KeyRound size={20} />, accent: "red" as const },
            { label: "Effectif de l'unité", value: unitAgents.length, icon: <Users size={20} />, hint: `${unitAgents.filter((a) => a.statut === "ACTIF").length} actifs` },
          ]
        : [
            { label: "Effectif total", value: state.agents.filter((a) => a.statut !== "RADIE").length, icon: <Users size={20} />, hint: `${state.agents.filter((a) => a.statut === "ACTIF").length} actifs` },
            { label: "Habilitations en attente", value: toReview.length, icon: <KeyRound size={20} />, accent: "red" as const },
            { label: "Candidatures en cours", value: state.candidatures.filter((c) => c.etape !== "RETENU" && c.etape !== "NON_RETENU").length, icon: <UserPlus size={20} /> },
            { label: "Événements d'audit", value: state.audit.length, icon: <ScrollText size={20} />, hint: "journal chaîné" },
          ];

  return (
    <>
      <PageHeader
        title={`Bonjour, ${GRADE_ABBR[me.agent.grade]} ${me.agent.nom.toUpperCase()}`}
        subtitle={`${ROLE_LABEL[me.role]} · ${me.unite.nom} · ${me.agent.affectation}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Kpi key={k.label} {...k} />
        ))}
      </div>

      {pendingPrePlaintes.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between rounded border border-amber-300 bg-amber-50 p-4 text-amber-950">
            <div>
              <p className="font-bold text-sm">
                {pendingPrePlaintes.length} pré-plainte(s) en ligne déposée(s) en attente de traitement
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Des victimes ont déposé une télé-déclaration pour votre unité ({me.unite.nom}). Un militaire doit fixer un rendez-vous ou instruire le dossier.
              </p>
            </div>
            <Link
              href="/intranet/pre-plaintes"
              className="ml-4 shrink-0 rounded bg-gend-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-gend-800"
            >
              Traiter les pré-plaintes
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        {can(me.role, "procedures:read") ? (
          <Card
            className="xl:col-span-2"
            title="Dernières procédures de l'unité"
            actions={
              <Link href="/intranet/procedures" className="inline-flex items-center gap-1 text-sm font-medium text-gend-900 hover:underline">
                Tout voir <ArrowRight size={14} aria-hidden />
              </Link>
            }
          >
            <div className="-m-5">
              <ProcedureTable procedures={procs.slice(0, 5)} caption="Dernières procédures" />
            </div>
          </Card>
        ) : (
          <Card className="xl:col-span-2" title="Répartition des candidatures">
            <ul className="space-y-3">
              {[...ETAPES_CANDIDATURE, "NON_RETENU" as const].map((e) => {
                const n = state.candidatures.filter((c) => c.etape === e).length;
                const pct = state.candidatures.length ? Math.round((n / state.candidatures.length) * 100) : 0;
                return (
                  <li key={e}>
                    <div className="flex justify-between text-sm">
                      <span>{ETAPE_CANDIDATURE[e].label}</span>
                      <span className="font-bold">{n}</span>
                    </div>
                    <div className="mt-1 h-2 bg-surface-alt" role="presentation">
                      <div className={e === "NON_RETENU" ? "h-2 bg-marianne" : "h-2 bg-gend-900"} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-ink-mute">
              Séparation des tâches : le profil administrateur n&apos;a pas accès au contenu des procédures judiciaires.
            </p>
          </Card>
        )}

        <Card
          title={can(me.role, "habilitations:review") ? "Habilitations à instruire" : "Mes demandes d'habilitation"}
          actions={
            <Link href="/intranet/habilitations" className="inline-flex items-center gap-1 text-sm font-medium text-gend-900 hover:underline">
              Gérer <ArrowRight size={14} aria-hidden />
            </Link>
          }
        >
          {(can(me.role, "habilitations:review") ? toReview : mine).length === 0 ? (
            <p className="text-sm text-ink-mute">Aucune demande.</p>
          ) : (
            <ul className="divide-y divide-line">
              {(can(me.role, "habilitations:review") ? toReview : mine).slice(0, 5).map((h) => {
                const d = agentsById.get(h.demandeurId);
                const st = STATUT_HABILITATION[h.statut];
                return (
                  <li key={h.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-ink">{HABILITATION_TYPE[h.type]}</p>
                        <p className="text-xs text-ink-mute">
                          {h.reference} · {d ? `${GRADE_ABBR[d.grade]} ${d.nom.toUpperCase()}` : "—"} · {fmtDate(h.createdAt)}
                        </p>
                      </div>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {me.role === "ADMIN" && (
        <Card className="mt-6" title="Activité récente (journal d'audit)">
          <ul className="divide-y divide-line text-sm">
            {state.audit.slice(0, 5).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                <span className="w-36 font-mono text-xs text-ink-mute">{fmtDateTime(l.date)}</span>
                <Badge tone="navy">{l.action}</Badge>
                <span className="text-ink-soft">{l.acteur}</span>
                <span className="text-ink-mute">→ {l.cible}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
