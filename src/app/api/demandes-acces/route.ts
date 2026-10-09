import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// S'assurer que les unités par défaut (Gendarmerie et Police Nationale) existent en base
async function ensureDefaultUnits() {
  const defaultUnits = [
    { id: "u1", code: "4512", nom: "BTA de Valmont-sur-Loire", type: "BRIGADE" as const },
    { id: "u2", code: "4530", nom: "Brigade de recherches de Valmont", type: "BR" as const },
    { id: "u3", code: "4540", nom: "PSIG de Valmont", type: "PSIG" as const },
    { id: "u4", code: "4500", nom: "État-major du groupement", type: "GROUPEMENT" as const },
    { id: "u5", code: "PN-7501", nom: "Commissariat central de Police (CSP Valmont)", type: "COMMISSARIAT" as const },
    { id: "u6", code: "PN-7512", nom: "Brigade Anti-Criminalité (BAC Valmont)", type: "BAC" as const },
    { id: "u7", code: "PN-7520", nom: "Division de Police Judiciaire (DTPJ / SLPJ)", type: "PJ" as const },
    { id: "u8", code: "PN-7500", nom: "Direction Interdépartementale de la Police Nationale (DIPN)", type: "DIPN" as const },
    { id: "u9", code: "TJ-4501", nom: "Tribunal Judiciaire de Valmont (TJ)", type: "TRIBUNAL_JUDICIAIRE" as const },
    { id: "u10", code: "TJ-4502", nom: "Parquet de la République de Valmont", type: "PARQUET" as const },
    { id: "u11", code: "TJ-4503", nom: "Cabinet du Juge d'instruction", type: "CABINET_INSTRUCTION" as const },
    { id: "u12", code: "BAR-4500", nom: "Ordre des Avocats / Barreau de Valmont", type: "BARREAU_AVOCATS" as const },
  ];

  for (const u of defaultUnits) {
    await prisma.unite.upsert({
      where: { code: u.code },
      update: { nom: u.nom, type: u.type },
      create: { id: u.id, code: u.code, nom: u.nom, type: u.type },
    }).catch(() => {});
  }
}

export async function GET() {
  try {
    await ensureDefaultUnits();
    const demandes = await prisma.demandeAcces.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formatted = demandes.map((d) => ({
      id: d.id,
      reference: d.reference,
      institution: d.institution as "GENDARMERIE" | "POLICE_NATIONALE",
      matricule: d.matricule,
      nom: d.nom,
      prenom: d.prenom,
      grade: d.grade,
      uniteId: d.uniteId,
      affectation: d.affectation,
      qualification: d.qualification,
      email: d.email,
      motif: d.motif,
      statut: d.statut,
      reponseComment: d.reponseComment || undefined,
      traiteParId: d.traiteParId || undefined,
      motDePasseInitial: d.motDePasseInitial || undefined,
      roleAttribue: d.roleAttribue || undefined,
      createdAt: d.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Erreur récupération demandes d'accès:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDefaultUnits();
    const body = await request.json();
    const {
      reference,
      institution,
      matricule,
      nom,
      prenom,
      grade,
      uniteId,
      affectation,
      qualification,
      email,
      motif,
    } = body;

    if (!matricule || !nom || !prenom || !uniteId || !email) {
      return NextResponse.json({ success: false, error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const ref = reference || `ACC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const demande = await prisma.demandeAcces.create({
      data: {
        reference: ref,
        institution: institution || "GENDARMERIE",
        matricule,
        nom,
        prenom,
        grade: grade || "GENDARME",
        uniteId,
        affectation: affectation || "Service général",
        qualification: qualification || "APJ20",
        email,
        motif: motif || "Demande d'accès initiale",
        statut: "EN_ATTENTE",
      },
    });

    return NextResponse.json({ success: true, data: demande });
  } catch (error) {
    console.error("Erreur création demande d'accès:", error);
    return NextResponse.json({ success: false, error: "Impossible d'enregistrer la demande" }, { status: 500 });
  }
}
