import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const procedureId = searchParams.get("procedureId");

    const auditions = await prisma.audition.findMany({
      where: procedureId ? { procedureId } : undefined,
      orderBy: {
        dateDebut: "desc",
      },
    });

    return NextResponse.json({ success: true, data: auditions });
  } catch (error) {
    console.error("Erreur récupération auditions:", error);
    return NextResponse.json({ success: false, error: "Erreur base de données" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      numeroPV,
      typeAudition,
      dateDebut,
      dateFin,
      lieu,
      cadreLegal,
      nom,
      nomUsage,
      prenom,
      dateNaissance,
      lieuNaissance,
      nationalite,
      profession,
      domicile,
      telephone,
      email,
      droitsNotifies,
      avocatDemande,
      avocatNom,
      interprete,
      plainteDeposee,
      prejudiceChiffre,
      declarations,
      enqueteurId,
      enqueteurNom,
      enqueteurGrade,
      enqueteurQualif,
      procedureId,
    } = body;

    if (!procedureId || !nom || !prenom || !declarations) {
      return NextResponse.json({ success: false, error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const created = await prisma.audition.create({
      data: {
        numeroPV: numeroPV || `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        typeAudition: typeAudition || "VICTIME_PLAINTE",
        dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
        dateFin: dateFin ? new Date(dateFin) : null,
        lieu: lieu || "Dans les locaux de l'unité",
        cadreLegal: cadreLegal || "ENQUETE_PRELIMINAIRE",
        nom,
        nomUsage: nomUsage || null,
        prenom,
        dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
        lieuNaissance: lieuNaissance || null,
        nationalite: nationalite || "Française",
        profession: profession || null,
        domicile: domicile || "Non précisé",
        telephone: telephone || null,
        email: email || null,
        droitsNotifies: droitsNotifies ?? true,
        avocatDemande: avocatDemande ?? false,
        avocatNom: avocatNom || null,
        interprete: interprete ?? false,
        plainteDeposee: plainteDeposee ?? false,
        prejudiceChiffre: prejudiceChiffre ? parseFloat(prejudiceChiffre) : null,
        declarations,
        enqueteurId: enqueteurId || "admin-1",
        enqueteurNom: enqueteurNom || "Gendarmerie",
        enqueteurGrade: enqueteurGrade || "GENDARME",
        enqueteurQualif: enqueteurQualif || "OPJ",
        procedureId,
      },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Erreur enregistrement audition:", error);
    return NextResponse.json({ success: false, error: "Impossible d'enregistrer l'audition" }, { status: 500 });
  }
}
