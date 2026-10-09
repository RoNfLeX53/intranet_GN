import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const list = await prisma.procedure.findMany({
      include: {
        redacteur: true,
        unite: true,
        rapports: true,
        auditions: true,
        historique: true,
      },
      orderBy: {
        dateOuverture: "desc",
      },
    });

    const formatted = list.map((p) => ({
      id: p.id,
      numeroPV: p.numeroPV,
      dateFaits: p.dateFaits.toISOString(),
      dateOuverture: p.dateOuverture.toISOString(),
      redacteurId: p.redacteurId,
      uniteId: p.uniteId,
      type: p.type,
      qualification: p.qualification,
      lieu: p.lieu,
      resume: p.resume,
      statut: p.statut,
      classification: p.classification,
      parquet: p.parquet || undefined,
      valideParId: p.valideParId || undefined,
      historique: p.historique.map((h) => ({
        date: h.date.toISOString(),
        acteurId: h.acteurId,
        action: h.action,
        commentaire: h.commentaire || undefined,
      })),
      rapports: p.rapports.map((r) => ({
        id: r.id,
        auteurId: r.auteurId,
        date: r.date.toISOString(),
        contenu: r.contenu,
      })),
      auditions: p.auditions.map((a) => ({
        id: a.id,
        numeroPV: a.numeroPV,
        typeAudition: a.typeAudition,
        dateDebut: a.dateDebut.toISOString(),
        dateFin: a.dateFin ? a.dateFin.toISOString() : undefined,
        lieu: a.lieu,
        cadreLegal: a.cadreLegal,
        nom: a.nom,
        nomUsage: a.nomUsage || undefined,
        prenom: a.prenom,
        dateNaissance: a.dateNaissance ? a.dateNaissance.toISOString() : undefined,
        lieuNaissance: a.lieuNaissance || undefined,
        nationalite: a.nationalite,
        profession: a.profession || undefined,
        domicile: a.domicile,
        telephone: a.telephone || undefined,
        email: a.email || undefined,
        droitsNotifies: a.droitsNotifies,
        avocatDemande: a.avocatDemande,
        avocatNom: a.avocatNom || undefined,
        interprete: a.interprete,
        plainteDeposee: a.plainteDeposee,
        prejudiceChiffre: a.prejudiceChiffre || undefined,
        declarations: a.declarations,
        enqueteurId: a.enqueteurId,
        enqueteurNom: a.enqueteurNom,
        enqueteurGrade: a.enqueteurGrade,
        enqueteurQualif: a.enqueteurQualif,
        procedureId: a.procedureId,
        createdAt: a.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Erreur récupération procédures:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      numeroPV,
      dateFaits,
      dateOuverture,
      type,
      qualification,
      lieu,
      resume,
      statut,
      classification,
      redacteurId,
      uniteId,
    } = body;

    if (!numeroPV || !qualification || !lieu || !resume || !redacteurId || !uniteId) {
      return NextResponse.json({ success: false, error: "Champs requis manquants" }, { status: 400 });
    }

    const proc = await prisma.procedure.create({
      data: {
        id: id || undefined,
        numeroPV,
        dateFaits: new Date(dateFaits || Date.now()),
        dateOuverture: dateOuverture ? new Date(dateOuverture) : new Date(),
        type: type || "ENQUETE_PRELIMINAIRE",
        qualification,
        lieu,
        resume,
        statut: statut || "OUVERTE",
        classification: classification || "DIFFUSION_RESTREINTE",
        redacteurId,
        uniteId,
        historique: {
          create: {
            date: new Date(),
            action: "Ouverture de la procédure judiciaire",
            acteurId: redacteurId,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: proc });
  } catch (error) {
    console.error("Erreur création procédure:", error);
    return NextResponse.json({ success: false, error: "Impossible de créer la procédure" }, { status: 500 });
  }
}
