"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Filter, Search, UserCheck } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useDemo } from "@/components/store";
import { Badge, Button, Card, EmptyState, Field, inputCls, PageHeader, Td, Th } from "@/components/ui";
import { ETAPE_CANDIDATURE, ETAPES_CANDIDATURE, OFFRE_LABEL } from "@/lib/labels";
import type { Candidature, EtapeCandidature, OffreType } from "@/lib/types";
import { fmtDate, fmtDateTime } from "@/lib/utils";

export default function RecrutementBackofficePage() {
  return (
    <Guard perm="recrutement:manage">
      <RecrutementBackofficeView />
    </Guard>
  );
}

function RecrutementBackofficeView() {
  const { state, dispatch } = useDemo();
  const [q, setQ] = useState("");
  const [offre, setOffre] = useState("");
  const [etape, setEtape] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const search = q.toLowerCase();
    return state.candidatures.filter((c) => {
      if (search && !`${c.nom} ${c.prenom} ${c.reference} ${c.email}`.toLowerCase().includes(search)) return false;
      if (offre && c.offre !== offre) return false;
      if (etape && c.etape !== etape) return false;
      return true;
    });
  }, [state.candidatures, q, offre, etape]);

  const selected = useMemo(() => {
    return state.candidatures.find((c) => c.id === selectedId) ?? filtered[0] ?? null;
  }, [state.candidatures, selectedId, filtered]);

  return (
    <>
      <PageHeader
        title="Pôle Recrutement — Back-office"
        subtitle="Gestion et suivi des candidatures d'incorporation (GAV, Sous-officier, Officier)"
        breadcrumb={<>Intranet › Ressources humaines › Recrutement</>}
      />

      {/* KPI mini-bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ETAPES_CANDIDATURE.map((et) => {
          const count = state.candidatures.filter((c) => c.etape === et).length;
          return (
            <div key={et} className="border border-line bg-white p-3">
              <p className="text-xs font-bold text-ink-mute">{ETAPE_CANDIDATURE[et].label}</p>
              <p className="text-2xl font-bold text-gend-900">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Recherche" htmlFor="rec-q">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                  <input
                    id="rec-q"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className={`${inputCls} pl-9`}
                    placeholder="Nom, réf..."
                  />
                </div>
              </Field>
              <Field label="Corps / Offre" htmlFor="rec-offre">
                <select id="rec-offre" value={offre} onChange={(e) => setOffre(e.target.value)} className={inputCls}>
                  <option value="">Toutes</option>
                  {(Object.keys(OFFRE_LABEL) as OffreType[]).map((o) => (
                    <option key={o} value={o}>{OFFRE_LABEL[o]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Étape" htmlFor="rec-etape">
                <select id="rec-etape" value={etape} onChange={(e) => setEtape(e.target.value)} className={inputCls}>
                  <option value="">Toutes</option>
                  {[...ETAPES_CANDIDATURE, "NON_RETENU" as const].map((e) => (
                    <option key={e} value={e}>{ETAPE_CANDIDATURE[e].label}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          <Card title={`Candidatures (${filtered.length})`}>
            <div className="-m-5 overflow-x-auto">
              {filtered.length === 0 ? (
                <EmptyState>Aucune candidature trouvée.</EmptyState>
              ) : (
                <table className="w-full border-collapse">
                  <thead className="border-b-2 border-gend-900 bg-surface">
                    <tr>
                      <Th>Réf</Th>
                      <Th>Candidat</Th>
                      <Th>Offre</Th>
                      <Th>Étape</Th>
                      <Th>Date</Th>
                      <Th><span className="sr-only">Actions</span></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => {
                      const isSel = selected?.id === c.id;
                      const st = ETAPE_CANDIDATURE[c.etape];
                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedId(c.id)}
                          className={`cursor-pointer transition-colors ${
                            isSel ? "bg-gend-50 font-medium" : i % 2 ? "bg-surface/50 hover:bg-slate-50" : "hover:bg-slate-50"
                          }`}
                        >
                          <Td className="font-mono text-xs font-bold text-gend-900">{c.reference}</Td>
                          <Td>
                            <span className="font-bold">{c.nom.toUpperCase()}</span> {c.prenom}
                            <span className="block text-xs text-ink-mute">{c.email}</span>
                          </Td>
                          <Td className="text-xs">{OFFRE_LABEL[c.offre]}</Td>
                          <Td>
                            <Badge tone={st.tone}>{st.label}</Badge>
                          </Td>
                          <Td className="whitespace-nowrap text-xs text-ink-mute">{fmtDate(c.createdAt)}</Td>
                          <Td>
                            <ChevronRight size={16} className={isSel ? "text-gend-900" : "text-ink-mute"} />
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>

        {/* Détail latéral et transition d'étape */}
        <div>
          {selected ? (
            <Card title={`Détail : ${selected.reference}`} className="sticky top-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gend-900">
                    {selected.prenom} {selected.nom.toUpperCase()}
                  </h3>
                  <p className="text-sm text-ink-soft">{OFFRE_LABEL[selected.offre]}</p>
                </div>

                <dl className="grid grid-cols-2 gap-2 text-sm border-t border-b border-line py-3">
                  <div>
                    <dt className="text-xs text-ink-mute">Email</dt>
                    <dd className="truncate text-ink font-mono text-xs">{selected.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-mute">Date naissance</dt>
                    <dd className="text-ink">{fmtDate(selected.dateNaissance)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-mute">Niveau d&apos;études</dt>
                    <dd className="text-ink">{selected.niveauEtudes}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-mute">Dépôt</dt>
                    <dd className="text-ink">{fmtDate(selected.createdAt)}</dd>
                  </div>
                </dl>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2">
                    Progression du recrutement
                  </h4>
                  <div className="space-y-2">
                    {[...ETAPES_CANDIDATURE, "NON_RETENU" as const].map((et) => {
                      const isCurrent = selected.etape === et;
                      const label = ETAPE_CANDIDATURE[et].label;
                      return (
                        <div
                          key={et}
                          className={`flex items-center justify-between p-2 rounded border text-sm ${
                            isCurrent
                              ? "border-gend-900 bg-gend-50 font-bold text-gend-900"
                              : "border-line bg-white text-ink-soft"
                          }`}
                        >
                          <span>{label}</span>
                          {isCurrent ? (
                            <Badge tone={ETAPE_CANDIDATURE[et].tone}>Étape active</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => dispatch({ type: "CANDIDATURE_MOVE", id: selected.id, etape: et })}
                            >
                              Basculer
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selected.historique && selected.historique.length > 0 && (
                  <div className="pt-3 border-t border-line">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-mute mb-2">Historique</h4>
                    <ul className="space-y-1 text-xs text-ink-mute">
                      {selected.historique.map((h, idx) => (
                        <li key={idx}>
                          {fmtDateTime(h.date)} — {h.action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState>Sélectionnez une candidature pour voir son détail.</EmptyState>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
