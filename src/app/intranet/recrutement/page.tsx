"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Copy, Filter, Search, UserCheck } from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, EmptyState, Field, inputCls, Modal, PageHeader, Td, Th } from "@/components/ui";
import { ETAPE_CANDIDATURE, ETAPES_CANDIDATURE, GRADE_ABBR, GRADE_LABEL, OFFRE_LABEL, ROLE_LABEL } from "@/lib/labels";
import type { Agent, AuthRole, Candidature, EtapeCandidature, Grade, OffreType, QualifJudiciaire, StatutActivite } from "@/lib/types";
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
  const me = useCurrentUser();
  const [q, setQ] = useState("");
  const [offre, setOffre] = useState("");
  const [etape, setEtape] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // État de modal pour acceptation & génération des identifiants
  const [acceptingCand, setAcceptingCand] = useState<Candidature | null>(null);
  const [acceptedCredentials, setAcceptedCredentials] = useState<{
    nomComplet: string;
    matricule: string;
    identifiant: string;
    motDePasse: string;
    grade: string;
    affectation: string;
  } | null>(null);

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
        subtitle="Gestion, instruction et acceptation des candidatures avec génération des identifiants intranet"
        breadcrumb={<>Intranet › Ressources humaines › Recrutement</>}
      />

      {/* Alerte si des identifiants viennent d'être générés */}
      {acceptedCredentials && (
        <div className="mb-6">
          <Alert tone="success" title="Candidature retenue — Accès intranet activé">
            <div className="space-y-2 mt-1">
              <p className="text-sm">
                L&apos;agent <strong>{acceptedCredentials.nomComplet}</strong> ({acceptedCredentials.grade}) a été incorporé avec succès.
                Voici ses identifiants de connexion officiels à lui transmettre :
              </p>
              <div className="bg-surface-alt border border-line p-3 rounded font-mono text-xs flex flex-wrap gap-4 items-center">
                <div>
                  <span className="text-ink-mute block">Identifiant / Matricule</span>
                  <strong className="text-gend-900 text-sm">{acceptedCredentials.identifiant}</strong>
                </div>
                <div>
                  <span className="text-ink-mute block">Mot de passe provisoire</span>
                  <strong className="text-marianne-dark text-sm">{acceptedCredentials.motDePasse}</strong>
                </div>
                <div>
                  <span className="text-ink-mute block">Affectation</span>
                  <span className="text-ink text-sm">{acceptedCredentials.affectation}</span>
                </div>
              </div>
              <p className="text-xs text-ink-mute">
                Ces identifiants sont immédiatement utilisables sur la page de connexion intranet.
              </p>
            </div>
          </Alert>
        </div>
      )}

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

                {/* Bouton d'incorporation directe / acceptation */}
                {selected.etape !== "RETENU" ? (
                  <div className="bg-gend-50 border border-gend-200 p-3 rounded">
                    <p className="text-xs font-bold text-gend-900 uppercase tracking-wide mb-1">
                      Action Administrateur
                    </p>
                    <p className="text-xs text-ink-mute mb-3">
                      Valider l&apos;incorporation de ce candidat et lui attribuer son matricule et mot de passe d&apos;accès intranet.
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setAcceptingCand(selected)}
                    >
                      <UserCheck size={16} aria-hidden /> Accepter la candidature & Créer l&apos;accès
                    </Button>
                  </div>
                ) : (
                  <Alert tone="success" title="Candidat Retenu">
                    Ce candidat a été accepté dans les rangs de la Gendarmerie.
                  </Alert>
                )}

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
                              onClick={() => {
                                if (et === "RETENU") {
                                  setAcceptingCand(selected);
                                } else {
                                  dispatch({ type: "CANDIDATURE_MOVE", id: selected.id, etape: et });
                                }
                              }}
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

      {/* Modal d'acceptation et de génération des identifiants */}
      {acceptingCand && (
        <AcceptCandidatureModal
          candidature={acceptingCand}
          onClose={() => setAcceptingCand(null)}
          onConfirm={(agentData) => {
            dispatch({
              type: "ACCEPT_CANDIDATURE_AND_CREATE_AGENT",
              candidatureId: acceptingCand.id,
              agentData,
            });
            setAcceptedCredentials({
              nomComplet: `${agentData.prenom} ${agentData.nom.toUpperCase()}`,
              matricule: agentData.matricule,
              identifiant: agentData.identifiant ?? agentData.matricule,
              motDePasse: agentData.motDePasse ?? "Gend2026!",
              grade: GRADE_LABEL[agentData.grade],
              affectation: agentData.affectation,
            });
            setAcceptingCand(null);
          }}
        />
      )}
    </>
  );
}

function AcceptCandidatureModal({
  candidature,
  onClose,
  onConfirm,
}: {
  candidature: Candidature;
  onClose: () => void;
  onConfirm: (agentData: Omit<Agent, "id" | "dateIncorporation">) => void;
}) {
  const { state } = useDemo();

  // Générer un matricule aléatoire ou incrémentiel (6 chiffres)
  const defaultMatricule = useMemo(() => {
    let num = 270000 + state.agents.length + 1;
    while (state.agents.some((a) => a.matricule === String(num))) {
      num++;
    }
    return String(num);
  }, [state.agents]);

  // Déduire un grade par défaut selon l'offre
  const defaultGrade: Grade =
    candidature.offre === "GAV"
      ? "GAV"
      : candidature.offre === "OFFICIER"
      ? "LIEUTENANT"
      : "GENDARME";

  const defaultRole: AuthRole =
    candidature.offre === "OFFICIER" ? "OFFICIER" : "AGENT";

  // Identifiant par défaut : première lettre prénom + nom en minuscule (ex: c.dubois ou le matricule)
  const defaultIdentifiant = `${candidature.prenom.charAt(0).toLowerCase()}${candidature.nom.toLowerCase()}`.replace(/[^a-z0-9]/g, "");

  const [matricule, setMatricule] = useState(defaultMatricule);
  const [identifiant, setIdentifiant] = useState(defaultIdentifiant);
  const [motDePasse, setMotDePasse] = useState("Gend2026!");
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [role, setRole] = useState<AuthRole>(defaultRole);
  const [uniteId, setUniteId] = useState("u1");
  const [affectation, setAffectation] = useState(
    candidature.offre === "GAV" ? "Accueil & Patrouille de brigade" : "Gendarme de brigade territoriale"
  );
  const [qualification, setQualification] = useState<QualifJudiciaire>(
    candidature.offre === "GAV" ? "APJ21" : candidature.offre === "OFFICIER" ? "OPJ" : "APJ20"
  );

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Accepter la candidature : ${candidature.prenom} ${candidature.nom.toUpperCase()}`}
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm({
            matricule,
            nom: candidature.nom,
            prenom: candidature.prenom,
            grade,
            uniteId,
            affectation,
            statut: "ACTIF" as StatutActivite,
            qualification,
            role,
            email: candidature.email,
            identifiant: identifiant || matricule,
            motDePasse: motDePasse || "Gend2026!",
          });
        }}
        className="space-y-4"
      >
        <Alert tone="info" title="Création du profil agent & Identifiants intranet">
          La validation de cette candidature créera automatiquement l&apos;agent dans l&apos;annuaire opérationnel avec les identifiants définis ci-dessous.
        </Alert>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Matricule (6 chiffres)" htmlFor="m-matricule">
            <input
              id="m-matricule"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              className={`${inputCls} font-mono`}
              maxLength={6}
              required
            />
          </Field>
          <Field label="Identifiant de connexion" hint="Nom d'utilisateur ou matricule" htmlFor="m-identifiant">
            <input
              id="m-identifiant"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className={`${inputCls} font-mono`}
              required
            />
          </Field>

          <Field label="Mot de passe provisoire" hint="Fourni au candidat accepté" htmlFor="m-mdp" className="sm:col-span-2">
            <input
              id="m-mdp"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={`${inputCls} font-mono`}
              required
            />
          </Field>

          <Field label="Grade d'incorporation" htmlFor="m-grade">
            <select
              id="m-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value as Grade)}
              className={inputCls}
            >
              {(Object.keys(GRADE_LABEL) as Grade[]).map((g) => (
                <option key={g} value={g}>{GRADE_LABEL[g]} ({GRADE_ABBR[g]})</option>
              ))}
            </select>
          </Field>

          <Field label="Rôle applicatif" htmlFor="m-role">
            <select
              id="m-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AuthRole)}
              className={inputCls}
            >
              {(["AGENT", "OFFICIER", "ADMIN"] as AuthRole[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </Field>

          <Field label="Unité d'affectation" htmlFor="m-unite">
            <select
              id="m-unite"
              value={uniteId}
              onChange={(e) => setUniteId(e.target.value)}
              className={inputCls}
            >
              {state.unites.map((u) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          </Field>

          <Field label="Affectation / Poste" htmlFor="m-affectation">
            <input
              id="m-affectation"
              value={affectation}
              onChange={(e) => setAffectation(e.target.value)}
              className={inputCls}
              required
            />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-line">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit">Valider & Générer les accès</Button>
        </div>
      </form>
    </Modal>
  );
}
