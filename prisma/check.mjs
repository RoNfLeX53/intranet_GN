import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  const agents = await prisma.agent.findMany();
  const prePlaintes = await prisma.prePlainte.findMany();
  console.log("AGENTS EN BDD:", agents.length);
  console.log(agents);
  console.log("PRE-PLAINTES EN BDD:", prePlaintes.length);
  console.log(prePlaintes);
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
