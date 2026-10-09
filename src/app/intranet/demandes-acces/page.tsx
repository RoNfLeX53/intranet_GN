"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  KeyRound,
  RotateCcw,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, EmptyState, Field, inputCls, Modal, PageHeader, Td, Th } from "@/components/ui";
import { GRADE_ABBR, GRADE_LABEL, INSTITUTION_LABEL, ROLE_LABEL, STATUT_DEMANDE_ACCES } from "@/lib/labels";
import type { AuthRole, DemandeAcces, Institution, StatutDemandeAcces } from "@/lib/types";
import { fmtDateTime } from "@/lib/utils";

export default function DemandesAccesAdminPage() {
  return (
    <Guard perm="agents:manage">
      <DemandesAccesView />
    </Guard>
  );
}

function DemandesAccesView() {
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;
  const [q, setQ] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("ALL");
  const [institutionFilter, setInstitutionFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(false);

  // Modals
  const [validating, setValidating] = useState<DemandeAcces | null>(null);
  const [rejecting, setRejecting] = useState<DemandeAcces | null>(null);
  const [viewingCreds, setViewingCreds] = useState<DemandeAcces | null>(null);

  async function reloadDemandes() {
    setLoading(true);
    try {
      const res = await fetch("/api/demandes-acces");
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        dispatch({ type: "SYNC_DEMANDES_ACCES", demandes: d.data });
      }
    } catch (e) {
      console.error("Erreur sync demandes d'accès:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadDemandes();
  }, []);

  const unitesById = useMemo(() => new Map(state.unites.map((u) => [u.id, u])), [state.unites]);

  const allDemandes = state.demandesAcces || [];

  const counts = useMemo(() => {
    return {
      all: allDemandes.length,
      pending: allDemandes.filter((d) => d.statut === "EN_ATTENTE").length,
      validee: allDemandes.filter((d) => d.statut === "VALIDEE").length,
      rejetee: allDemandes.filter((d) => d.statut === "REJETEE").length,
    };
  }, [allDemandes]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    return allDemandes.filter((d) => {
      if (statutFilter !== "ALL" && d.statut !== statutFilter) return false;
      if (institutionFilter !== "ALL" && d.institution !== institutionFilter) return false;
      if (
        s &&
        !`${d.reference} ${d.matricule} ${d.nom} ${d.prenom} ${d.email} ${d.affectation}`
          .toLowerCase()
          .includes(s)
      ) {
        return false;
      }
      return true;
    });
  }, [allDemandes, statutFilter, institutionFilter, q]);

  return (
    <>
      <PageHeader
        title="Demandes d'accès à l'intranet"
        subtitle={`Validation des immatriculations des personnels (Gendarmerie & Police Nationale) — ${counts.pending} demande(s) en attente`}
        breadcrumb={<>Intranet › Ressources humaines › Demandes d&apos;accès</>}
        actions={
          <Button variant="secondary" onClick={reloadDemandes} disabled={loading}>
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} aria-hidden />
            {loading ? "Actualisation..." : "Rafraîchir"}
          </Button>
        }
      />

      {/* Cartes d'indicateurs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-line bg-white p-4 shadow-sm border-l-4 border-l-gend-900">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Total demandes</p>
          <p className="mt-1 text-2xl font-bold text-ink">{counts.all}</p>
        </div>
        <div className="border border-line bg-white p-4 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">En attente de validation</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{counts.pending}</p>
        </div>
        <div className="border border-line bg-white p-4 shadow-sm border-l-4 border-l-emerald-600">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Comptes activés</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{counts.validee}</p>
        </div>
        <div className="border border-line bg-white p-4 shadow-sm border-l-4 border-l-marianne-dark">
          <p className="text-xs font-bold uppercase tracking-wider text-marianne-dark">Demandes refusées</p>
          <p className="mt-1 text-2xl font-bold text-marianne-dark">{counts.rejetee}</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Recherche rapide" hint="Matricule, RIO, nom, email ou affectation" htmlFor="search-input" className="md:col-span-2">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" aria-hidden />
                <input
                  id="search-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={`${inputCls} pl-9`}
                  placeholder="ex. 245781 ou DUPONT..."
                />
              </div>
            </Field>

            <Field label="Force / Institution" htmlFor="inst-select">
              <select
                id="inst-select"
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                className={inputCls}
              >
                <option value="ALL">Toutes les forces & juridictions</option>
                <option value="GENDARMERIE">Gendarmerie nationale</option>
                <option value="POLICE_NATIONALE">Police nationale</option>
                <option value="JUSTICE">Justice & Juridictions (Tribunal, Parquet, Barreau)</option>
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-xs font-bold uppercase text-ink-mute mr-2">Statut :</span>
            {[
              { key: "ALL", label: `Toutes (${counts.all})` },
              { key: "EN_ATTENTE", label: `En attente (${counts.pending})` },
              { key: "VALIDEE", label: `Validées (${counts.validee})` },
              { key: "REJETEE", label: `Refusées (${counts.rejetee})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatutFilter(tab.key)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                  statutFilter === tab.key
                    ? "bg-gend-900 text-white shadow-sm"
                    : "bg-surface border border-line text-ink hover:border-gend-900"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {(q || statutFilter !== "ALL" || institutionFilter !== "ALL") && (
              <Button
                variant="tertiary"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setQ("");
                  setStatutFilter("ALL");
                  setInstitutionFilter("ALL");
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tableau des demandes */}
      <Card title={<span aria-live="polite">{filtered.length} demande(s) d&apos;accès</span>}>
        <div className="-m-5 overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState>
              Aucune demande d&apos;accès ne correspond aux critères sélectionnés.
            </EmptyState>
          ) : (
            <table className="w-full border-collapse">
              <caption className="sr-only">Liste des demandes d&apos;accès à l&apos;intranet</caption>
              <thead className="border-b-2 border-gend-900 bg-surface">
                <tr>
                  <Th>Réf. / Date</Th>
                  <Th>Force / Demandeur</Th>
                  <Th>Affectation & Unité</Th>
                  <Th>Qualif. & Contact</Th>
                  <Th>Motif de la demande</Th>
                  <Th>Statut</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, i) => {
                  const st = STATUT_DEMANDE_ACCES[d.statut];
                  const u = unitesById.get(d.uniteId);
                  const isPN = d.institution === "POLICE_NATIONALE";
                  const isJustice = d.institution === "JUSTICE";

                  return (
                    <tr key={d.id} className={i % 2 ? "bg-surface/60" : undefined}>
                      <Td className="whitespace-nowrap">
                        <span className="font-mono font-bold text-xs text-gend-900">{d.reference}</span>
                        <span className="block text-xs text-ink-mute">{fmtDateTime(d.createdAt)}</span>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isJustice
                                ? "bg-purple-100 text-purple-900 border border-purple-300"
                                : isPN
                                ? "bg-blue-100 text-blue-900 border border-blue-300"
                                : "bg-gend-100 text-gend-900 border border-gend-300"
                            }`}
                          >
                            {isJustice ? <Scale size={10} /> : isPN ? <Building2 size={10} /> : <Shield size={10} />}
                            {isJustice ? "Justice" : isPN ? "Police" : "Gendarmerie"}
                          </span>
                          <span className="font-mono text-xs font-bold text-ink-soft">
                            {isJustice ? `Réf. ${d.matricule}` : isPN ? `RIO ${d.matricule}` : `Mle ${d.matricule}`}
                          </span>
                        </div>
                        <span className="font-bold text-sm text-ink">
                          {d.nom.toUpperCase()} {d.prenom}
                        </span>
                        <span className="block text-xs text-ink-mute">
                          {GRADE_LABEL[d.grade]} ({GRADE_ABBR[d.grade]})
                        </span>
                      </Td>

                      <Td>
                        <span className="font-medium text-ink text-sm">{u?.nom ?? d.uniteId}</span>
                        <span className="block text-xs text-ink-mute">{d.affectation}</span>
                      </Td>

                      <Td>
                        <Badge tone="navy" className="text-[11px] mb-1">
                          {d.qualification}
                        </Badge>
                        <a
                          href={`mailto:${d.email}`}
                          className="block text-xs text-gend-800 hover:underline font-mono truncate max-w-[14rem]"
                        >
                          {d.email}
                        </a>
                      </Td>

                      <Td className="max-w-xs">
                        <p className="line-clamp-2 text-xs text-ink" title={d.motif}>
                          « {d.motif} »
                        </p>
                        {d.reponseComment && (
                          <p className="mt-1 text-xs italic text-ink-soft">
                            Note RH : {d.reponseComment}
                          </p>
                        )}
                      </Td>

                      <Td>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </Td>

                      <Td className="whitespace-nowrap text-right">
                        {d.statut === "EN_ATTENTE" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => setValidating(d)}
                              icon={<UserCheck size={14} />}
                              className="bg-emerald-700 hover:bg-emerald-800 text-white"
                            >
                              Valider l&apos;accès
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setRejecting(d)}
                              icon={<UserX size={14} />}
                              className="text-marianne-dark border-marianne-dark hover:bg-marianne-dark/5"
                            >
                              Refuser
                            </Button>
                          </div>
                        ) : d.statut === "VALIDEE" ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setViewingCreds(d)}
                            icon={<KeyRound size={14} />}
                          >
                            Identifiants
                          </Button>
                        ) : (
                          <span className="text-xs text-ink-mute italic">Dossier clôturé</span>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modal de validation de la demande */}
      {validating && (
        <ValidateAccessModal
          demande={validating}
          open={!!validating}
          onClose={() => setValidating(null)}
          onConfirm={async (roleAttribue, motDePasse, commentaire) => {
            try {
              await fetch(`/api/demandes-acces/${validating.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  statut: "VALIDEE",
                  roleAttribue,
                  motDePasse,
                  commentaire,
                  adminId: me.agent.id,
                }),
              });
            } catch (err) {
              console.warn("Échec PATCH api demandes-acces:", err);
            }

            dispatch({
              type: "DEMANDE_ACCES_DECIDE",
              id: validating.id,
              statut: "VALIDEE",
              roleAttribue,
              motDePasse,
              commentaire,
            });

            // Afficher le récapitulatif pour que l'admin puisse copier les identifiants
            setViewingCreds({
              ...validating,
              statut: "VALIDEE",
              roleAttribue,
              motDePasseInitial: motDePasse,
              reponseComment: commentaire,
            });
            setValidating(null);
          }}
        />
      )}

      {/* Modal de rejet de la demande */}
      {rejecting && (
        <RejectAccessModal
          demande={rejecting}
          open={!!rejecting}
          onClose={() => setRejecting(null)}
          onConfirm={async (commentaire) => {
            try {
              await fetch(`/api/demandes-acces/${rejecting.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  statut: "REJETEE",
                  commentaire,
                  adminId: me.agent.id,
                }),
              });
            } catch (err) {
              console.warn("Échec PATCH api demandes-acces:", err);
            }

            dispatch({
              type: "DEMANDE_ACCES_DECIDE",
              id: rejecting.id,
              statut: "REJETEE",
              commentaire,
            });

            setRejecting(null);
          }}
        />
      )}

      {/* Modal de consultation des identifiants remis */}
      {viewingCreds && (
        <CredentialsModal
          demande={viewingCreds}
          open={!!viewingCreds}
          onClose={() => setViewingCreds(null)}
        />
      )}
    </>
  );
}

function ValidateAccessModal({
  demande,
  open,
  onClose,
  onConfirm,
}: {
  demande: DemandeAcces;
  open: boolean;
  onClose: () => void;
  onConfirm: (role: AuthRole, motDePasse: string, commentaire: string) => Promise<void> | void;
}) {
  const isPN = demande.institution === "POLICE_NATIONALE";
  const isJustice = demande.institution === "JUSTICE";
  const defaultPass = isJustice ? "Justice2026!" : isPN ? "Police2026!" : "Gend2026!";
  const initialRole: AuthRole = isJustice
    ? demande.qualification === "AVOCAT" || demande.grade === "AVOCAT_BARREAU" || demande.grade === "BATONNIER"
      ? "AVOCAT"
      : "MAGISTRAT"
    : demande.qualification === "OPJ"
    ? "OFFICIER"
    : "AGENT";

  const [role, setRole] = useState<AuthRole>(initialRole);
  const [motDePasse, setMotDePasse] = useState(defaultPass);
  const [commentaire, setCommentaire] = useState("Vérification matricule et affectation validées par le bureau RH / SI.");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await onConfirm(role, motDePasse, commentaire);
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Validation d'accès & Activation du compte" size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Personnel à immatriculer
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-base font-bold text-emerald-950">
              {GRADE_LABEL[demande.grade]} {demande.prenom} {demande.nom.toUpperCase()}
            </span>
            <span className="font-mono text-xs text-emerald-800">
              ({isJustice ? `Réf. ${demande.matricule}` : isPN ? `RIO ${demande.matricule}` : `Mle ${demande.matricule}`})
            </span>
          </div>
          <p className="mt-1 text-xs text-emerald-900">
            {INSTITUTION_LABEL[demande.institution]} · {demande.affectation} · {demande.qualification}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rôle applicatif attribué" htmlFor="val-role" hint="Niveau de permissions sur l'intranet">
            <select
              id="val-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AuthRole)}
              className={inputCls}
            >
              <option value="AGENT">Agent (Consultation & Rédaction)</option>
              <option value="OFFICIER">Gradé / OPJ (Validation & Signature)</option>
              <option value="MAGISTRAT">Magistrat (Parquet / Siège - Direction & Réquisitions)</option>
              <option value="AVOCAT">Avocat au Barreau (Défense / Partie civile)</option>
              <option value="ADMIN">Administrateur RH / DSI (Gestion complète)</option>
            </select>
          </Field>

          <Field
            label="Mot de passe d'accès initial"
            htmlFor="val-pass"
            hint="Ce mot de passe permettra à l'agent de se connecter"
          >
            <div className="flex gap-2">
              <input
                id="val-pass"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={`${inputCls} font-mono font-bold`}
                required
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setMotDePasse(`Pass${Math.floor(Math.random() * 9000 + 1000)}!`)}
                title="Générer un autre mot de passe"
              >
                Aléatoire
              </Button>
            </div>
          </Field>
        </div>

        <Field label="Observations / Note d'immatriculation" htmlFor="val-comm" hint="Consigné au journal d'audit">
          <input
            id="val-comm"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Alert tone="info">
          La validation active immédiatement le compte dans la base PostgreSQL. L&apos;agent pourra se connecter sur l&apos;écran de connexion en utilisant son <strong>matricule ({demande.matricule})</strong> et ce mot de passe.
        </Alert>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading} className="bg-emerald-700 hover:bg-emerald-800 text-white">
            <UserCheck size={16} />
            {loading ? "Activation..." : "Activer le compte opérationnel"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RejectAccessModal({
  demande,
  open,
  onClose,
  onConfirm,
}: {
  demande: DemandeAcces;
  open: boolean;
  onClose: () => void;
  onConfirm: (commentaire: string) => Promise<void> | void;
}) {
  const [motif, setMotif] = useState("Matricule officiel non reconnu dans les effectifs du corps d'appartenance.");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!motif.trim()) return;
    setLoading(true);
    await onConfirm(motif.trim());
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Refuser la demande d'accès" size="md">
      <form onSubmit={submit} className="space-y-4">
        <Alert tone="error" title={`Refus pour ${demande.prenom} ${demande.nom.toUpperCase()} (Mle ${demande.matricule})`}>
          Cette action rejettera la demande d&apos;immatriculation. Aucun compte ne sera ouvert.
        </Alert>

        <Field label="Motif officiel de refus" htmlFor="rej-motif" hint="Sélectionnez ou modifiez le motif">
          <select
            id="rej-motif-select"
            className={`${inputCls} mb-2`}
            onChange={(e) => setMotif(e.target.value)}
          >
            <option value="Matricule officiel non reconnu dans les effectifs du corps d'appartenance.">
              Matricule officiel non reconnu dans les effectifs
            </option>
            <option value="Adresse de messagerie électronique non conforme au domaine officiel gouv.fr.">
              Adresse de messagerie non officielle
            </option>
            <option value="Unité de rattachement ou affectation incorrecte.">
              Unité de rattachement incorrecte
            </option>
            <option value="Demande d'accès redondante avec un compte déjà actif.">
              Demande en doublon avec compte actif
            </option>
          </select>
          <textarea
            id="rej-motif"
            rows={3}
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className={inputCls}
            required
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="danger" disabled={loading}>
            <UserX size={16} />
            {loading ? "Traitement..." : "Confirmer le refus"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CredentialsModal({
  demande,
  open,
  onClose,
}: {
  demande: DemandeAcces;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isPN = demande.institution === "POLICE_NATIONALE";
  const pass = demande.motDePasseInitial || (isPN ? "Police2026!" : "Gend2026!");

  function copyCreds() {
    const text = `Accès Intranet Sentinelle\nIdentifiant / Matricule : ${demande.matricule}\nMot de passe : ${pass}\nRôle : ${ROLE_LABEL[demande.roleAttribue || "AGENT"]}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Modal open={open} onClose={onClose} title="Identifiants d'accès du personnel" size="md">
      <div className="space-y-4">
        <Alert tone="success" title="Compte opérationnel actif">
          Le compte de <strong>{demande.prenom} {demande.nom.toUpperCase()}</strong> ({GRADE_LABEL[demande.grade]}) est correctement configuré.
        </Alert>

        <div className="rounded border border-line bg-surface p-4 space-y-3 font-mono text-sm">
          <div>
            <span className="text-xs uppercase text-ink-mute block font-sans">Identifiant de connexion :</span>
            <span className="font-bold text-gend-900 text-base">{demande.matricule}</span>
          </div>

          <div>
            <span className="text-xs uppercase text-ink-mute block font-sans">Mot de passe temporaire :</span>
            <span className="font-bold text-ink text-base">{pass}</span>
          </div>

          <div>
            <span className="text-xs uppercase text-ink-mute block font-sans">Rôle attribué :</span>
            <span className="font-bold text-ink text-sm font-sans">{ROLE_LABEL[demande.roleAttribue || "AGENT"]}</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2">
          <Button variant="secondary" onClick={copyCreds} icon={copied ? <Check size={16} /> : <Copy size={16} />}>
            {copied ? "Copié dans le presse-papier !" : "Copier les identifiants"}
          </Button>
          <Button onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
}
