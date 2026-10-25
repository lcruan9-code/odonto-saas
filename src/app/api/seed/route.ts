import { NextRequest, NextResponse } from "next/server";
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

// Rota de conveniência para popular dados de demonstração a partir do navegador
// (ex: testando pelo celular, sem acesso a terminal/CLI). Só funciona se SEED_SECRET
// estiver configurada no ambiente e a chave enviada bater com ela.
export async function GET(req: NextRequest) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Rota desativada" }, { status: 404 });
  }

  const key = req.nextUrl.searchParams.get("key");
  if (key !== secret) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 403 });
  }

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

  return NextResponse.json({
    ok: true,
    clinicUrl: `/agendar/${clinic.slug}`,
    login: "admin@clinicaexemplo.com.br / admin123",
  });
}
