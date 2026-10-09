import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { auteurId, contenu } = body;

    if (!auteurId || !contenu) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 });
    }

    const rapport = await prisma.rapportProcedure.create({
      data: {
        procedureId: id,
        auteurId,
        contenu,
      },
    });

    await prisma.historiqueProcedure.create({
      data: {
        procedureId: id,
        acteurId: auteurId,
        action: "Ajout d'un rapport / mention",
        date: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: rapport });
  } catch (error) {
    console.error("Erreur ajout rapport:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}
