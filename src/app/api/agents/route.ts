import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        user: true,
        unite: true,
      },
      orderBy: {
        nom: "asc",
      },
    });

    const formatted = agents.map((a) => ({
      id: a.id,
      matricule: a.matricule,
      nom: a.nom,
      prenom: a.prenom,
      grade: a.grade,
      uniteId: a.uniteId,
      affectation: a.affectation,
      statut: a.statut,
      qualification: a.qualification,
      role: a.user?.role || "AGENT",
      email: a.user?.email || "",
      identifiant: a.user?.email.split("@")[0] || a.matricule,
      dateIncorporation: a.dateIncorporation.toISOString().slice(0, 10),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Erreur récupération agents:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matricule, nom, prenom, grade, uniteId, affectation, statut, qualification, role, email } = body;

    if (!matricule || !nom || !prenom || !uniteId) {
      return NextResponse.json({ success: false, error: "Champs requis manquants" }, { status: 400 });
    }

    const userEmail = email || `${matricule}@gendarmerie.interieur.gouv.fr`;

    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: { role: role || "AGENT" },
      create: {
        email: userEmail,
        role: role || "AGENT",
      },
    });

    const agent = await prisma.agent.upsert({
      where: { matricule },
      update: {
        nom,
        prenom,
        grade: grade || "GENDARME",
        affectation: affectation || "Service général",
        statut: statut || "ACTIF",
        qualification: qualification || "AUCUNE",
        uniteId,
      },
      create: {
        matricule,
        nom,
        prenom,
        grade: grade || "GENDARME",
        affectation: affectation || "Service général",
        statut: statut || "ACTIF",
        qualification: qualification || "AUCUNE",
        dateIncorporation: new Date(),
        userId: user.id,
        uniteId,
      },
    });

    return NextResponse.json({ success: true, data: agent });
  } catch (error) {
    console.error("Erreur création agent:", error);
    return NextResponse.json({ success: false, error: "Impossible de créer l'agent" }, { status: 500 });
  }
}
