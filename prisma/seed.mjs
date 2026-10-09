import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Démarrage du peuplement initial de la base Supabase PostgreSQL...");

  // 1. Unités opérationnelles
  const unitesData = [
    { id: "u1", code: "4512", nom: "BTA de Valmont-sur-Loire", type: "BRIGADE" },
    { id: "u2", code: "4530", nom: "Brigade de recherches de Valmont", type: "BR" },
    { id: "u3", code: "4540", nom: "PSIG de Valmont", type: "PSIG" },
    { id: "u4", code: "4500", nom: "État-major du groupement", type: "GROUPEMENT" },
  ];

  for (const u of unitesData) {
    await prisma.unite.upsert({
      where: { code: u.code },
      update: { nom: u.nom, type: u.type },
      create: {
        id: u.id,
        code: u.code,
        nom: u.nom,
        type: u.type,
      },
    });
  }
  console.log("✓ Unités territoriales créées ou vérifiées.");

  // 2. Compte Administrateur initial (CDT Lambert)
  const adminUser = await prisma.user.upsert({
    where: { email: "s.lambert@gendarmerie.interieur.gouv.fr" },
    update: { role: "ADMIN" },
    create: {
      id: "user-admin-1",
      email: "s.lambert@gendarmerie.interieur.gouv.fr",
      role: "ADMIN",
    },
  });

  await prisma.agent.upsert({
    where: { matricule: "176540" },
    update: {
      nom: "Lambert",
      prenom: "Sophie",
      grade: "COMMANDANT",
      uniteId: "u4",
      affectation: "Cheffe du bureau RH / SI",
      statut: "ACTIF",
      qualification: "OPJ",
    },
    create: {
      id: "admin-1",
      matricule: "176540",
      nom: "Lambert",
      prenom: "Sophie",
      grade: "COMMANDANT",
      affectation: "Cheffe du bureau RH / SI",
      statut: "ACTIF",
      qualification: "OPJ",
      dateIncorporation: new Date("2015-09-01"),
      userId: adminUser.id,
      uniteId: "u4",
    },
  });
  console.log("✓ Compte administrateur initial (CDT Lambert - Matricule 176540) configuré.");

  console.log("Initialisation terminée avec succès.");
}

main()
  .catch((e) => {
    console.error("Erreur de peuplement :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
