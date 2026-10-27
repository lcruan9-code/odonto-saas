import { PrismaClient } from "@prisma/client";
import { runDemoSeed } from "../src/lib/demo-seed";

const prisma = new PrismaClient();

runDemoSeed(prisma)
  .then((result) => console.log("Seed concluído.", result))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
