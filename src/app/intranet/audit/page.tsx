"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Filter, KeyRound, Lock, Search, ShieldAlert } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useDemo } from "@/components/store";
import { Alert, Badge, Card, Field, inputCls, PageHeader, Td, Th } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/labels";
import type { Role } from "@/lib/types";
import { fmtDateTime, verifyAuditChain } from "@/lib/utils";

export default function AuditPage() {
  return (
    <Guard perm="audit:read">
      <AuditView />
    </Guard>
  );
}

function AuditView() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("");

  const integrity = useMemo(() => {
    return verifyAuditChain(state.audit);
  }, [state.audit]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return state.audit.filter((log) => {
      if (s && !`${log.action} ${log.acteur} ${log.cible} ${log.ip} ${log.hash}`.toLowerCase().includes(s)) return false;
      if (role && log.role !== role) return false;
      return true;
    });
  }, [state.audit, q, role]);

  return (
    <>
      <PageHeader
        title="Journal d'audit & Traçabilité"
        subtitle="Registre infalsifiable à chaîne de hachage — Journalisation de toutes les actions sensibles"
        breadcrumb={<>Intranet › Sécurité › Journal d&apos;audit</>}
      />

      <div className="mb-6">
        {integrity.ok ? (
          <Alert tone="success" title="Intégrité cryptographique vérifiée">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Toutes les empreintes SHA/hash de la chaîne sont valides. Aucun journal altéré.
            </span>
          </Alert>
        ) : (
          <Alert tone="error" title="Rupture d'intégrité détectée">
            <span className="flex items-center gap-2">
              <ShieldAlert size={16} /> Discordance d&apos;empreinte au niveau du bloc {integrity.brokenAt}. Alerte de sécurité levée.
            </span>
          </Alert>
        )}
      </div>

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Filtrer les événements" htmlFor="audit-q">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input
                id="audit-q"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="Action, acteur, cible, IP, hash..."
              />
            </div>
          </Field>
          <Field label="Rôle de l'acteur" htmlFor="audit-role">
            <select id="audit-role" value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              <option value="">Tous les rôles</option>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card title={`Événements enregistrés (${filtered.length})`}>
        <div className="-m-5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b-2 border-gend-900 bg-surface">
              <tr>
                <Th>Horodatage</Th>
                <Th>Acteur & Rôle</Th>
                <Th>Action</Th>
                <Th>Cible</Th>
                <Th>IP</Th>
                <Th>Empreinte (Hash)</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={l.id} className={i % 2 ? "bg-surface/50" : undefined}>
                  <Td className="whitespace-nowrap font-mono text-xs">{fmtDateTime(l.date)}</Td>
                  <Td>
                    <span className="font-bold text-xs">{l.acteur}</span>
                    <span className="block text-[0.65rem] text-ink-mute">{ROLE_LABEL[l.role]}</span>
                  </Td>
                  <Td>
                    <Badge tone="navy">{l.action}</Badge>
                  </Td>
                  <Td className="text-xs font-mono">{l.cible}</Td>
                  <Td className="font-mono text-xs text-ink-mute">{l.ip}</Td>
                  <Td>
                    <span
                      title={`Hash: ${l.hash} (Précédent: ${l.prevHash})`}
                      className="inline-block max-w-[7rem] truncate font-mono text-[0.65rem] text-ink-mute bg-surface-alt px-1.5 py-0.5 rounded"
                    >
                      {l.hash}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
