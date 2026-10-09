"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  MapPin,
  Phone,
  Search,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { Guard } from "@/components/intranet/Guard";
import { AuditionModal } from "@/components/intranet/AuditionModal";
import { useCurrentUser, useDemo } from "@/components/store";
import { Alert, Badge, Button, Card, Field, inputCls, Modal, PageHeader } from "@/components/ui";
import { STATUT_PRE_PLAINTE, TYPE_INFRACTION_PRE_PLAINTE } from "@/lib/labels";
import type { Audition, PrePlainte, Procedure, StatutPrePlainte, TypeDossier } from "@/lib/types";
import { nowLocal, uid } from "@/lib/utils";

export default function PrePlaintesPage() {
  return (
    <Guard perm="preplaintes:read">
      <PrePlaintesView />
    </Guard>
  );
}

function PrePlaintesView() {
  const { state, dispatch } = useDemo();
  const me = useCurrentUser()!;

  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [filterUnite, setFilterUnite] = useState<string>("");
  const [selected, setSelected] = useState<PrePlainte | null>(null);
  const [loading, setLoading] = useState(false);

  // Rechargement depuis la base Supabase PostgreSQL
  async function reloadFromDB() {
    setLoading(true);
    try {
      const res = await fetch("/api/pre-plainte");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const list: PrePlainte[] = data.data.map((item: any) => ({
          id: item.id,
          numeroDossier: item.numeroDossier,
          typeInfraction: item.typeInfraction,
          dateFaits: typeof item.dateFaits === "string" ? item.dateFaits : new Date(item.dateFaits).toISOString(),
          lieuFaits: item.lieuFaits,
          description: item.description,
          auteurInconnu: item.auteurInconnu,
          prejudiceEstime: item.prejudiceEstime,
          statut: item.statut,
          dateRdv: item.dateRdv ? new Date(item.dateRdv).toLocaleString("fr-FR") : undefined,
          createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date(item.createdAt).toISOString(),
          victimeNom: item.victimeNom,
          victimePrenom: item.victimePrenom,
          victimeEmail: item.victimeEmail,
          victimeTelephone: item.victimeTelephone,
          victimeAdresse: item.victimeAdresse,
          uniteId: item.uniteId,
          agentId: item.agentId,
        }));
        dispatch({ type: "SYNC_PRE_PLAINTES", prePlaintes: list });
      }
    } catch (e) {
      console.error("Erreur rechargement pré-plaintes:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadFromDB();
  }, []);

  // Modales d'actions
  const [rdvModal, setRdvModal] = useState(false);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvHeure, setRdvHeure] = useState("09:00");

  const [convertModal, setConvertModal] = useState(false);
  const [pvType, setPvType] = useState<TypeDossier>("ENQUETE_PRELIMINAIRE");
  const [pvQualification, setPvQualification] = useState("");
  const [pvResume, setPvResume] = useState("");

  const [auditionModalData, setAuditionModalData] = useState<{
    procedure: Procedure;
    initialData: Partial<Audition>;
    prePlainteId: string;
  } | null>(null);

  function handleStartDeposition(p: PrePlainte) {
    const count = state.procedures.length + 1;
    const numeroPV = `${me.unite.code}/${String(count).padStart(5, "0")}`;
    const now = nowLocal();

    const proc: Procedure = {
      id: uid(),
      numeroPV,
      dateFaits: p.dateFaits,
      dateOuverture: now,
      redacteurId: me.agent.id,
      uniteId: p.uniteId,
      type: "ENQUETE_PRELIMINAIRE",
      qualification: TYPE_INFRACTION_PRE_PLAINTE[p.typeInfraction],
      lieu: p.lieuFaits,
      resume: `Procédure initiée suite à la télé-procédure de pré-plainte en ligne réf. ${p.numeroDossier} déposée par ${p.victimePrenom} ${p.victimeNom.toUpperCase()}.\n\nFaits constatés : ${p.description}`,
      statut: "OUVERTE",
      classification: "DIFFUSION_RESTREINTE",
      historique: [
        {
          date: now,
          acteurId: me.agent.id,
          action: `Prise de déposition et audition de plainte pour le dossier ${p.numeroDossier}`,
        },
      ],
      rapports: [],
      auditions: [],
    };

    dispatch({ type: "PROCEDURE_CREATE", procedure: proc });

    setAuditionModalData({
      procedure: proc,
      prePlainteId: p.id,
      initialData: {
        typeAudition: "VICTIME_PLAINTE",
        nom: p.victimeNom,
        prenom: p.victimePrenom,
        domicile: p.victimeAdresse,
        telephone: p.victimeTelephone,
        email: p.victimeEmail,
        plainteDeposee: true,
        prejudiceChiffre: p.prejudiceEstime,
        declarations:
          `QUESTION : Que pouvez-vous nous déclarer concernant les faits constatés ?\n` +
          `RÉPONSE : J'ai déposé une pré-plainte en ligne enregistrée sous la référence ${p.numeroDossier} et je me présente ce jour en vos locaux pour confirmer ma déposition.\n` +
          `Faits constatés : ${p.description}\n\n` +
          `QUESTION : Pouvez-vous nous confirmer le lieu et la date de commission de cette infraction ?\n` +
          `RÉPONSE : Les faits se sont produits le ${p.dateFaits.replace("T", " à ")} au niveau de : ${p.lieuFaits}.\n\n` +
          `QUESTION : L'auteur de ces faits vous est-il connu ou suspectez-vous une personne en particulier ?\n` +
          `RÉPONSE : Non, l'auteur m'est totalement inconnu.\n\n` +
          `QUESTION : Quel est le montant de votre préjudice et disposez-vous de factures justificatives ?\n` +
          `RÉPONSE : Mon préjudice s'élève à ${p.prejudiceEstime ? `${p.prejudiceEstime} €` : "un montant en cours d'évaluation"}.\n\n` +
          `QUESTION : Déclarez-vous formellement déposer plainte et vous constituer partie civile pour ces faits ?\n` +
          `RÉPONSE : Oui, je déclare déposer plainte et me réserve le droit de solliciter la réparation intégrale de mon préjudice devant la juridiction compétente.`,
      },
    });
  }

  // Pré-plaintes accessibles selon le rôle et l'unité
  const visible = useMemo(() => {
    const list = state.prePlaintes ?? [];
    if (!filterUnite) return list;
    return list.filter((p) => p.uniteId === filterUnite);
  }, [state.prePlaintes, filterUnite]);

  // Filtrage
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return visible
      .filter((p) => {
        if (
          q &&
          !`${p.numeroDossier} ${p.victimeNom} ${p.victimePrenom} ${p.lieuFaits} ${p.description}`
            .toLowerCase()
            .includes(q)
        ) {
          return false;
        }
        if (filterStatut && p.statut !== filterStatut) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [visible, search, filterStatut]);

  // Fixer un rendez-vous en brigade
  async function handleAssignRdv(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const fullRdv = `${rdvDate} à ${rdvHeure}`;
    dispatch({
      type: "PRE_PLAINTE_UPDATE_STATUT",
      id: selected.id,
      statut: "CONVOQUEE",
      dateRdv: fullRdv,
    });

    setSelected({
      ...selected,
      statut: "CONVOQUEE",
      dateRdv: fullRdv,
    });
    setRdvModal(false);

    try {
      await fetch("/api/pre-plainte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, statut: "CONVOQUEE", dateRdv: rdvDate }),
      });
    } catch (err) {
      console.warn("Échec mise à jour BDD convocation :", err);
    }
  }

  // Convertir en Procès-Verbal judiciaire officiel
  async function handleConvertToProcedure(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;

    const count = state.procedures.length + 1;
    const numeroPV = `${me.unite.code}/${String(count).padStart(5, "0")}`;
    const now = nowLocal();

    const newProc: Procedure = {
      id: uid(),
      numeroPV,
      dateFaits: selected.dateFaits,
      dateOuverture: now,
      redacteurId: me.agent.id,
      uniteId: selected.uniteId,
      type: pvType,
      qualification: pvQualification || TYPE_INFRACTION_PRE_PLAINTE[selected.typeInfraction],
      lieu: selected.lieuFaits,
      resume:
        pvResume ||
        `Procédure initiée suite à la télé-procédure de pré-plainte en ligne réf. ${selected.numeroDossier} déposée par ${selected.victimePrenom} ${selected.victimeNom.toUpperCase()}.\n\nFaits constatés : ${selected.description}`,
      statut: "OUVERTE",
      classification: "DIFFUSION_RESTREINTE",
      historique: [
        {
          date: now,
          acteurId: me.agent.id,
          action: `Audition du plaignant et signature du PV consécutif à la pré-plainte ${selected.numeroDossier}`,
        },
      ],
      rapports: [
        {
          id: uid(),
          auteurId: me.agent.id,
          date: now,
          contenu: `Procès-verbal de plainte dressé après vérification d'identité et audition de ${selected.victimePrenom} ${selected.victimeNom.toUpperCase()}.\nPréjudice estimé : ${selected.prejudiceEstime ? `${selected.prejudiceEstime} €` : "non précisé"}.`,
        },
      ],
    };

    dispatch({
      type: "PRE_PLAINTE_CONVERT_TO_PROCEDURE",
      id: selected.id,
      procedure: newProc,
    });

    setSelected({
      ...selected,
      statut: "TRANSFORMEE_EN_PV",
    });
    setConvertModal(false);

    try {
      await fetch("/api/pre-plainte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, statut: "TRANSFORMEE_EN_PV" }),
      });
    } catch (err) {
      console.warn("Échec mise à jour BDD conversion PV :", err);
    }
  }

  // Classer sans suite
  async function handleClasser() {
    if (!selected) return;
    dispatch({
      type: "PRE_PLAINTE_UPDATE_STATUT",
      id: selected.id,
      statut: "CLASSEE_SANS_SUITE",
    });
    setSelected({
      ...selected,
      statut: "CLASSEE_SANS_SUITE",
    });

    try {
      await fetch("/api/pre-plainte", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, statut: "CLASSEE_SANS_SUITE" }),
      });
    } catch (err) {
      console.warn("Échec mise à jour BDD classement :", err);
    }
  }

  return (
    <>
      <PageHeader
        title="Pré-plaintes en ligne"
        subtitle={`Base de données Supabase connectée — ${visible.length} télé-déclaration(s) chargée(s)`}
        breadcrumb={<>Intranet › Activité opérationnelle › Pré-plaintes</>}
        actions={
          <Button
            variant="secondary"
            onClick={reloadFromDB}
            disabled={loading}
          >
            {loading ? "Synchronisation..." : "Rafraîchir depuis la base de données"}
          </Button>
        }
      />

      {/* Barre de recherche et filtres */}
      <Card className="mb-6" title="Filtres opérationnels">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Recherche par mot-clé" hint="N° de dossier, plaignant, commune...">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputCls} pl-9`}
                placeholder="Ex. PP-2026-4512 ou Dupont"
              />
            </div>
          </Field>

          <Field label="Unité de gendarmerie">
            <select
              value={filterUnite}
              onChange={(e) => setFilterUnite(e.target.value)}
              className={inputCls}
            >
              <option value="">Toutes les unités territoriales</option>
              {state.unites.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nom}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Statut du dossier">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className={inputCls}
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUT_PRE_PLAINTE).map(([k, s]) => (
                <option key={k} value={k}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={() => {
                setSearch("");
                setFilterStatut("");
                setFilterUnite("");
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Tableau des pré-plaintes */}
      <div className="overflow-x-auto border border-line bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-gray-50 text-xs font-bold uppercase text-ink-soft">
            <tr>
              <th className="px-4 py-3">Réf. Dossier</th>
              <th className="px-4 py-3">Date de dépôt</th>
              <th className="px-4 py-3">Plaignant</th>
              <th className="px-4 py-3">Infraction / Faits</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">
                  Aucune déclaration de pré-plainte trouvée dans ce périmètre.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const s = STATUT_PRE_PLAINTE[p.statut];
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gend-900">{p.numeroDossier}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.createdAt.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">
                        {p.victimePrenom} {p.victimeNom.toUpperCase()}
                      </div>
                      <div className="text-xs text-ink-mute">{p.victimeTelephone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gend-900">
                        {TYPE_INFRACTION_PRE_PLAINTE[p.typeInfraction]}
                      </div>
                      <div className="text-xs text-ink-soft line-clamp-1">{p.lieuFaits}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={s.tone}>{s.label}</Badge>
                      {p.dateRdv && (
                        <div className="mt-1 text-xs text-gend-900 font-medium">RDV : {p.dateRdv}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelected(p);
                          setPvQualification(TYPE_INFRACTION_PRE_PLAINTE[p.typeInfraction]);
                          setPvResume(
                            `Procédure d'audition suite à pré-plainte en ligne ${p.numeroDossier}.\nPlaignant : ${p.victimePrenom} ${p.victimeNom.toUpperCase()} (${p.victimeAdresse}).\nFaits constatés à ${p.lieuFaits} : ${p.description}`
                          );
                        }}
                      >
                        Consulter
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de détail du dossier */}
      {selected && (
        <Modal
          title={`Dossier de pré-plainte : ${selected.numeroDossier}`}
          open={!!selected}
          onClose={() => setSelected(null)}
        >
          <div className="space-y-6">
            {/* Statut & badge */}
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <span className="text-xs text-ink-soft">Statut de la télé-procédure :</span>
                <div className="mt-1">
                  <Badge tone={STATUT_PRE_PLAINTE[selected.statut].tone}>
                    {STATUT_PRE_PLAINTE[selected.statut].label}
                  </Badge>
                </div>
              </div>
              {selected.dateRdv && (
                <div className="text-right">
                  <span className="text-xs text-ink-soft">Convocation programmée :</span>
                  <p className="font-bold text-sm text-gend-900">{selected.dateRdv}</p>
                </div>
              )}
            </div>

            {/* Coordonnées plaignant */}
            <div className="rounded border border-line bg-gray-50 p-4 space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gend-900">
                Plaignant / Victime
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-ink-soft">Identité :</span>{" "}
                  <strong>{selected.victimePrenom} {selected.victimeNom.toUpperCase()}</strong>
                </div>
                <div>
                  <span className="text-ink-soft">Téléphone :</span> {selected.victimeTelephone}
                </div>
                <div>
                  <span className="text-ink-soft">Email :</span> {selected.victimeEmail}
                </div>
                <div>
                  <span className="text-ink-soft">Adresse :</span> {selected.victimeAdresse}
                </div>
              </div>
            </div>

            {/* Détails de l'infraction */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gend-900">
                Circonstances de l&apos;infraction
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-ink-soft">Infraction déclarée :</span>{" "}
                  <strong>{TYPE_INFRACTION_PRE_PLAINTE[selected.typeInfraction]}</strong>
                </div>
                <div>
                  <span className="text-ink-soft">Date des faits :</span> {selected.dateFaits.replace("T", " à ")}
                </div>
                <div>
                  <span className="text-ink-soft">Lieu :</span> {selected.lieuFaits}
                </div>
                <div>
                  <span className="text-ink-soft">Préjudice estimé :</span>{" "}
                  {selected.prejudiceEstime ? `${selected.prejudiceEstime} €` : "Non évalué"}
                </div>
              </div>

              <div className="mt-2 rounded border border-line p-3 bg-white text-sm">
                <span className="text-xs font-semibold text-ink-soft">Déclaration du déclarant :</span>
                <p className="mt-1 whitespace-pre-line text-ink">{selected.description}</p>
              </div>
            </div>

            {/* Actions opérationnelles */}
            <div className="pt-4 border-t border-line flex flex-wrap gap-2 justify-end">
              {selected.statut === "DEPOSEE" && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setRdvDate(new Date().toISOString().slice(0, 10));
                    setRdvModal(true);
                  }}
                  icon={<Calendar size={16} />}
                >
                  Fixer convocation (RDV)
                </Button>
              )}

              {selected.statut !== "TRANSFORMEE_EN_PV" && selected.statut !== "CLASSEE_SANS_SUITE" && (
                <Button
                  onClick={() => handleStartDeposition(selected)}
                  icon={<UserCheck size={16} />}
                >
                  Prendre la déposition (Audition de plainte)
                </Button>
              )}

              {selected.statut !== "TRANSFORMEE_EN_PV" && selected.statut !== "CLASSEE_SANS_SUITE" && (
                <Button
                  variant="secondary"
                  onClick={() => setConvertModal(true)}
                  icon={<FileCheck2 size={16} />}
                >
                  Générer PV simple
                </Button>
              )}

              {selected.statut !== "CLASSEE_SANS_SUITE" && selected.statut !== "TRANSFORMEE_EN_PV" && (
                <Button variant="danger" onClick={handleClasser} icon={<XCircle size={16} />}>
                  Classer sans suite
                </Button>
              )}

              <Button variant="ghost" onClick={() => setSelected(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Convocation RDV */}
      {rdvModal && selected && (
        <Modal
          title={`Convocation pour le dossier ${selected.numeroDossier}`}
          open={rdvModal}
          onClose={() => setRdvModal(false)}
        >
          <form onSubmit={handleAssignRdv} className="space-y-4">
            <p className="text-sm text-ink-soft">
              Fixez le créneau de rendez-vous en brigade pour recevoir <strong>{selected.victimePrenom} {selected.victimeNom}</strong> et procéder à la signature du procès-verbal.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date de convocation" required>
                <input
                  type="date"
                  required
                  className={inputCls}
                  value={rdvDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setRdvDate(e.target.value)}
                />
              </Field>
              <Field label="Heure du rendez-vous" required>
                <input
                  type="time"
                  required
                  className={inputCls}
                  value={rdvHeure}
                  onChange={(e) => setRdvHeure(e.target.value)}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button type="button" variant="ghost" onClick={() => setRdvModal(false)}>
                Annuler
              </Button>
              <Button type="submit">Valider la convocation</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Conversion en Procès-Verbal */}
      {convertModal && selected && (
        <Modal
          title={`Génération du Procès-Verbal judiciaire`}
          open={convertModal}
          onClose={() => setConvertModal(false)}
        >
          <form onSubmit={handleConvertToProcedure} className="space-y-4">
            <Alert tone="info" title="Signature & officialisation">
              La pré-plainte <strong>{selected.numeroDossier}</strong> va être formalisée en procédure judiciaire dans l&apos;unité {me.unite.nom} avec vous-même ({me.agent.nom.toUpperCase()} {me.agent.prenom}) comme rédacteur.
            </Alert>

            <Field label="Cadre d'enquête judiciaire" required>
              <select
                className={inputCls}
                value={pvType}
                onChange={(e) => setPvType(e.target.value as TypeDossier)}
              >
                <option value="ENQUETE_PRELIMINAIRE">Enquête préliminaire</option>
                <option value="FLAGRANT_DELIT">Flagrant délit</option>
                <option value="INTERVENTION">Fiche d&apos;intervention</option>
              </select>
            </Field>

            <Field label="Qualification juridique de l'infraction" required>
              <input
                type="text"
                required
                className={inputCls}
                value={pvQualification}
                onChange={(e) => setPvQualification(e.target.value)}
              />
            </Field>

            <Field label="Synthèse du procès-verbal d'audition" required>
              <textarea
                rows={4}
                required
                className={inputCls}
                value={pvResume}
                onChange={(e) => setPvResume(e.target.value)}
              />
            </Field>

            <div className="flex justify-end gap-2 pt-4 border-t border-line">
              <Button type="button" variant="ghost" onClick={() => setConvertModal(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer et signer le PV</Button>
            </div>
          </form>
        </Modal>
      )}

      {auditionModalData && (
        <AuditionModal
          procedure={auditionModalData.procedure}
          initialData={auditionModalData.initialData}
          open={!!auditionModalData}
          onClose={() => setAuditionModalData(null)}
          onSaved={async () => {
            dispatch({
              type: "PRE_PLAINTE_UPDATE_STATUT",
              id: auditionModalData.prePlainteId,
              statut: "TRANSFORMEE_EN_PV",
            });
            try {
              await fetch("/api/pre-plainte", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: auditionModalData.prePlainteId,
                  statut: "TRANSFORMEE_EN_PV",
                }),
              });
            } catch (e) {
              console.warn("Échec mise à jour statut pré-plainte :", e);
            }
            if (selected && selected.id === auditionModalData.prePlainteId) {
              setSelected({ ...selected, statut: "TRANSFORMEE_EN_PV" });
            }
          }}
        />
      )}
    </>
  );
}
