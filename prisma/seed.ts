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

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@clinicaexemplo.com.br" },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Administrador",
      email: "admin@clinicaexemplo.com.br",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const dentistPasswordHash = await bcrypt.hash("dentista123", 10);
  const dentistUser = await prisma.user.upsert({
    where: { email: "dentista@clinicaexemplo.com.br" },
    update: {},
    create: {
      clinicId: clinic.id,
      name: "Dra. Ana Souza",
      email: "dentista@clinicaexemplo.com.br",
      passwordHash: dentistPasswordHash,
      role: Role.DENTIST,
    },
  });

  await prisma.dentist.upsert({
    where: { userId: dentistUser.id },
    update: {},
    create: {
      clinicId: clinic.id,
      userId: dentistUser.id,
      specialty: "Clínico Geral",
      cro: "CRO-SP 12345",
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
