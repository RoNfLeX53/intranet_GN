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
      institution: (a.institution as "GENDARMERIE" | "POLICE_NATIONALE") || "GENDARMERIE",
      nom: a.nom,
      prenom: a.prenom,
      grade: a.grade,
      uniteId: a.uniteId,
      affectation: a.affectation,
      statut: a.statut,
      qualification: a.qualification,
      role: a.user?.role || "AGENT",
      email: a.user?.email || "",
      identifiant: a.identifiant || a.user?.email.split("@")[0] || a.matricule,
      motDePasse: a.motDePasse || undefined,
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
    const {
      matricule,
      institution,
      nom,
      prenom,
      grade,
      uniteId,
      affectation,
      statut,
      qualification,
      role,
      email,
      identifiant,
      motDePasse,
    } = body;

    if (!matricule || !nom || !prenom || !uniteId) {
      return NextResponse.json({ success: false, error: "Champs requis manquants" }, { status: 400 });
    }

    const defaultDomain = institution === "POLICE_NATIONALE" ? "police.interieur.gouv.fr" : "gendarmerie.interieur.gouv.fr";
    const userEmail = email || `${matricule}@${defaultDomain}`;
    const pass = motDePasse || (institution === "POLICE_NATIONALE" ? "Police2026!" : "Gend2026!");

    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        role: role || "AGENT",
        passwordHash: pass,
      },
      create: {
        email: userEmail,
        role: role || "AGENT",
        passwordHash: pass,
      },
    });

    const agent = await prisma.agent.upsert({
      where: { matricule },
      update: {
        institution: institution || "GENDARMERIE",
        nom,
        prenom,
        grade: grade || "GENDARME",
        affectation: affectation || "Service général",
        statut: statut || "ACTIF",
        qualification: qualification || "AUCUNE",
        uniteId,
        identifiant: identifiant || matricule,
        motDePasse: pass,
      },
      create: {
        matricule,
        institution: institution || "GENDARMERIE",
        nom,
        prenom,
        grade: grade || "GENDARME",
        affectation: affectation || "Service général",
        statut: statut || "ACTIF",
        qualification: qualification || "AUCUNE",
        identifiant: identifiant || matricule,
        motDePasse: pass,
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
