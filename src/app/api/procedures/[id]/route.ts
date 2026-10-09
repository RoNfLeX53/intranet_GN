import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proc = await prisma.procedure.findUnique({
      where: { id },
      include: {
        redacteur: true,
        unite: true,
        rapports: true,
        auditions: true,
        historique: true,
      },
    });

    if (!proc) {
      return NextResponse.json({ success: false, error: "Procédure introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: proc });
  } catch (error) {
    console.error("Erreur récupération procédure [id]:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      type,
      qualification,
      lieu,
      resume,
      statut,
      classification,
      parquet,
      valideParId,
      dateFaits,
      commentaire,
      acteurId,
    } = body;

    const updated = await prisma.procedure.update({
      where: { id },
      data: {
        ...(type ? { type } : {}),
        ...(qualification ? { qualification } : {}),
        ...(lieu ? { lieu } : {}),
        ...(resume ? { resume } : {}),
        ...(statut ? { statut } : {}),
        ...(classification ? { classification } : {}),
        ...(parquet !== undefined ? { parquet } : {}),
        ...(valideParId !== undefined ? { valideParId } : {}),
        ...(dateFaits ? { dateFaits: new Date(dateFaits) } : {}),
        historique: {
          create: {
            date: new Date(),
            action: commentaire ? `Mise à jour : ${commentaire}` : "Modification de la procédure",
            acteurId: acteurId || "system",
            commentaire: commentaire || null,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erreur mise à jour procédure [id]:", error);
    return NextResponse.json({ success: false, error: "Impossible de mettre à jour la procédure" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.procedure.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Procédure supprimée avec succès" });
  } catch (error) {
    console.error("Erreur suppression procédure [id]:", error);
    return NextResponse.json({ success: false, error: "Impossible de supprimer la procédure" }, { status: 500 });
  }
}
