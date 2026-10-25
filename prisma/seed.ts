import { PrismaClient, DayOfWeek, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const WEEKDAYS: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

async function main() {
  const clinic = await prisma.clinic.upsert({
    where: { slug: "clinica-exemplo" },
    update: {},
    create: {
      name: "Clínica Exemplo",
      slug: "clinica-exemplo",
      phone: "(11) 99999-0000",
      email: "contato@clinicaexemplo.com.br",
      address: "Rua Exemplo, 123",
      workingHours: {
        create: WEEKDAYS.map((dayOfWeek) => ({
          dayOfWeek,
          startTime: "08:00",
          endTime: "18:00",
        })),
      },
    },
  });

  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@clinicaexemplo.com.br" },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Administrador",
      email: "admin@clinicaexemplo.com.br",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
