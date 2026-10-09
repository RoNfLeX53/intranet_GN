import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { statut, commentaire, motDePasse, roleAttribue, adminId } = body;

    const demande = await prisma.demandeAcces.findUnique({
      where: { id },
    });

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande introuvable" }, { status: 404 });
    }

    const updated = await prisma.demandeAcces.update({
      where: { id },
      data: {
        statut,
        reponseComment: commentaire || null,
        traiteParId: adminId || null,
        motDePasseInitial: motDePasse || null,
        roleAttribue: roleAttribue || "AGENT",
      },
    });

    // Si la demande est validée, nous créons/activons automatiquement l'Agent et le User dans PostgreSQL
    if (statut === "VALIDEE") {
      const userEmail = demande.email;
      const pass = motDePasse || "Sentinelle2026!";
      const chosenRole = roleAttribue || "AGENT";

      const user = await prisma.user.upsert({
        where: { email: userEmail },
        update: {
          role: chosenRole,
          passwordHash: pass, // mot de passe initial
        },
        create: {
          email: userEmail,
          role: chosenRole,
          passwordHash: pass,
        },
      });

      await prisma.agent.upsert({
        where: { matricule: demande.matricule },
        update: {
          institution: demande.institution,
          nom: demande.nom,
          prenom: demande.prenom,
          grade: demande.grade,
          uniteId: demande.uniteId,
          affectation: demande.affectation,
          qualification: demande.qualification,
          statut: "ACTIF",
          identifiant: demande.matricule,
          motDePasse: pass,
        },
        create: {
          matricule: demande.matricule,
          institution: demande.institution,
          nom: demande.nom,
          prenom: demande.prenom,
          grade: demande.grade,
          uniteId: demande.uniteId,
          affectation: demande.affectation,
          qualification: demande.qualification,
          statut: "ACTIF",
          identifiant: demande.matricule,
          motDePasse: pass,
          dateIncorporation: new Date(),
          userId: user.id,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erreur mise à jour demande d'accès:", error);
    return NextResponse.json({ success: false, error: "Erreur lors du traitement" }, { status: 500 });
  }
}
