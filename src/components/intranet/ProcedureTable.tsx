"use client";

import Link from "next/link";
import { ChevronRight, Lock } from "lucide-react";
import { useDemo } from "@/components/store";
import { Badge, EmptyState, Td, Th } from "@/components/ui";
import { GRADE_ABBR, STATUT_PROCEDURE, TYPE_DOSSIER } from "@/lib/labels";
import type { Procedure } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export function ProcedureTable({ procedures, caption }: { procedures: Procedure[]; caption: string }) {
  const { state } = useDemo();
  const agentsById = new Map(state.agents.map((a) => [a.id, a]));

  if (!procedures.length) return <EmptyState>Aucune procédure ne correspond aux critères.</EmptyState>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b-2 border-gend-900 bg-surface">
          <tr>
            <Th>N° de PV</Th>
            <Th>Date des faits</Th>
            <Th>Rédacteur</Th>
            <Th>Qualification</Th>
            <Th>Type</Th>
            <Th>Statut</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {procedures.map((p, i) => {
            const r = agentsById.get(p.redacteurId);
            const st = STATUT_PROCEDURE[p.statut];
            return (
              <tr key={p.id} className={i % 2 ? "bg-surface/60 hover:bg-gend-50" : "hover:bg-gend-50"}>
                <Td>
                  <Link href={`/intranet/procedures/${p.id}`} className="font-mono font-bold text-gend-900 underline-offset-2 hover:underline">
                    {p.numeroPV}
                  </Link>
                  {p.classification === "DIFFUSION_RESTREINTE" && (
                    <span className="mt-1 flex items-center gap-1 text-[0.65rem] font-bold uppercase text-marianne-dark">
                      <Lock size={10} aria-hidden /> DR
                    </span>
                  )}
                </Td>
                <Td className="whitespace-nowrap">{fmtDate(p.dateFaits)}</Td>
                <Td>
                  {r ? (
                    <>
                      <span className="whitespace-nowrap">
                        {GRADE_ABBR[r.grade]} {r.nom.toUpperCase()}
                      </span>
                      <span className="block font-mono text-xs text-ink-mute">{r.matricule}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className="min-w-[14rem]">{p.qualification}</Td>
                <Td className="whitespace-nowrap text-ink-soft">{TYPE_DOSSIER[p.type]}</Td>
                <Td>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Td>
                <Td>
                  <Link href={`/intranet/procedures/${p.id}`} className="inline-flex p-1 text-gend-900 hover:bg-gend-100" aria-label={`Ouvrir la procédure ${p.numeroPV}`}>
                    <ChevronRight size={18} />
                  </Link>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
