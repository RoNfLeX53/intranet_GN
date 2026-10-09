import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const list = await prisma.prePlainte.findMany({
      include: {
        unite: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    console.error("Erreur récupération pré-plaintes:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      typeInfraction,
      dateFaits,
      lieuFaits,
      description,
      prejudiceEstime,
      victimeNom,
      victimePrenom,
      victimeEmail,
      victimeTelephone,
      victimeAdresse,
      uniteId,
    } = body;

    if (!typeInfraction || !dateFaits || !lieuFaits || !description || !victimeNom || !victimePrenom || !victimeEmail || !uniteId) {
      return NextResponse.json({ success: false, error: "Champs obligatoires manquants" }, { status: 400 });
    }

    // Génération du numéro de dossier unique PP-AAAA-XXXX
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const numeroDossier = `PP-${year}-${randomDigits}`;

    const created = await prisma.prePlainte.create({
      data: {
        numeroDossier,
        typeInfraction,
        dateFaits: new Date(dateFaits),
        lieuFaits,
        description,
        auteurInconnu: true,
        prejudiceEstime: prejudiceEstime ? parseFloat(prejudiceEstime) : null,
        statut: "DEPOSEE",
        victimeNom,
        victimePrenom,
        victimeEmail,
        victimeTelephone,
        victimeAdresse,
        uniteId,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Erreur enregistrement pré-plainte:", error);
    return NextResponse.json({ success: false, error: "Impossible d'enregistrer la pré-plainte" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, statut, dateRdv } = body;
    if (!id || !statut) {
      return NextResponse.json({ success: false, error: "ID et statut requis" }, { status: 400 });
    }
    const updated = await prisma.prePlainte.update({
      where: { id },
      data: {
        statut,
        ...(dateRdv ? { dateRdv: new Date(dateRdv) } : {}),
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erreur mise à jour pré-plainte:", error);
    return NextResponse.json({ success: false, error: "Impossible de mettre à jour" }, { status: 500 });
  }
}

