import { AppointmentStatus, DayOfWeek, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

// Empresa 100% fictícia usada como demonstração. Nomes, CROs, telefones e
// e-mails são inventados; fotos são do Unsplash (licença livre) em
// public/images/demo. Idempotente: pode rodar várias vezes sem duplicar.

const SLUG = "sorriso-pleno";
const LEGACY_SLUG = "clinica-exemplo";
const DOMAIN = "sorrisopleno.com.br";

const CLINIC = {
  name: "Sorriso Pleno Odontologia",
  phone: "(11) 3456-7890",
  email: `contato@${DOMAIN}`,
  address: "Rua das Acácias, 245 – Jardim Paulista, São Paulo – SP",
  description:
    "Odontologia completa para toda a família: prevenção, ortodontia, implantes e estética, com agendamento online e atendimento humanizado.",
  coverImageUrl: "/images/demo/hero-paciente.jpg",
  aboutImageUrl: "/images/demo/consultorio.jpg",
  ctaText: "Agende sua Consulta",
  primaryColor: "#0A2B4E",
  secondaryColor: "#007A8A",
  accentColor: "#3BBEB8",
  slotDurationMinutes: 30,
  published: true,
};

const HOURS: { day: DayOfWeek; start: string; end: string; active: boolean }[] = [
  { day: DayOfWeek.MONDAY, start: "08:00", end: "19:00", active: true },
  { day: DayOfWeek.TUESDAY, start: "08:00", end: "19:00", active: true },
  { day: DayOfWeek.WEDNESDAY, start: "08:00", end: "19:00", active: true },
  { day: DayOfWeek.THURSDAY, start: "08:00", end: "19:00", active: true },
  { day: DayOfWeek.FRIDAY, start: "08:00", end: "18:00", active: true },
  { day: DayOfWeek.SATURDAY, start: "08:00", end: "12:00", active: true },
  { day: DayOfWeek.SUNDAY, start: "08:00", end: "12:00", active: false },
];

const STAFF = [
  {
    legacyEmail: "admin@clinicaexemplo.com.br",
    email: `admin@${DOMAIN}`,
    name: "Carla Mendes",
    role: Role.ADMIN,
    password: "admin123",
  },
  {
    email: `recepcao@${DOMAIN}`,
    name: "Camila Rocha",
    role: Role.RECEPTIONIST,
    password: "recepcao123",
  },
];

const DENTISTS = [
  {
    legacyEmail: "dentista@clinicaexemplo.com.br",
    email: `ana.souza@${DOMAIN}`,
    name: "Dra. Ana Souza",
    specialty: "Clínica Geral e Prevenção",
    cro: "CRO-SP 112.345",
    photoUrl: "/images/demo/dentista-ana.jpg",
    publicBio: "Cuida da saúde bucal de toda a família, com foco em prevenção e orientação.",
  },
  {
    email: `mariana.costa@${DOMAIN}`,
    name: "Dra. Mariana Costa",
    specialty: "Ortodontia",
    cro: "CRO-SP 118.902",
    photoUrl: "/images/demo/dentista-mariana.jpg",
    publicBio: "Aparelhos fixos e alinhadores transparentes para adolescentes e adultos.",
  },
  {
    email: `rafael.almeida@${DOMAIN}`,
    name: "Dr. Rafael Almeida",
    specialty: "Implantodontia",
    cro: "CRO-SP 109.874",
    photoUrl: "/images/demo/dentista-rafael.jpg",
    publicBio: "Reabilitação oral com implantes e próteses fixas sobre implante.",
  },
  {
    email: `bruno.martins@${DOMAIN}`,
    name: "Dr. Bruno Martins",
    specialty: "Endodontia",
    cro: "CRO-SP 121.556",
    photoUrl: "/images/demo/dentista-bruno.jpg",
    publicBio: "Tratamento de canal com técnica mecanizada, mais rápido e confortável.",
  },
];

const SERVICES = [
  ["Avaliação e Limpeza", "Consulta de avaliação, profilaxia e orientação de higiene bucal."],
  ["Ortodontia", "Aparelhos fixos e alinhadores transparentes para alinhar o sorriso."],
  ["Implantes Dentários", "Reposição de dentes perdidos com implantes e próteses fixas."],
  ["Clareamento Dental", "Clareamento em consultório ou caseiro, com acompanhamento."],
  ["Tratamento de Canal", "Endodontia para preservar dentes comprometidos, com conforto."],
  ["Odontopediatria", "Atendimento acolhedor e lúdico para crianças."],
] as const;

const PATIENTS: [string, string, string?][] = [
  ["Lucas Pereira", "(11) 98123-4501", "lucas.pereira@email.com"],
  ["Fernanda Lima", "(11) 98123-4502", "fernanda.lima@email.com"],
  ["Gabriel Santos", "(11) 98123-4503"],
  ["Beatriz Oliveira", "(11) 98123-4504", "bia.oliveira@email.com"],
  ["Rodrigo Carvalho", "(11) 98123-4505"],
  ["Patrícia Gomes", "(11) 98123-4506", "patricia.gomes@email.com"],
  ["Thiago Ribeiro", "(11) 98123-4507"],
  ["Larissa Araújo", "(11) 98123-4508", "larissa.araujo@email.com"],
  ["Eduardo Barbosa", "(11) 98123-4509"],
  ["Aline Nascimento", "(11) 98123-4510", "aline.nasc@email.com"],
  ["Marcos Teixeira", "(11) 98123-4511"],
  ["Helena Duarte", "(11) 98123-4512", "helena.duarte@email.com"],
];

const NOTES_BY_DENTIST = [
  ["Avaliação e limpeza", "Retorno de prevenção", "Restauração"],
  ["Manutenção do aparelho", "Moldagem para alinhadores", "Avaliação ortodôntica"],
  ["Consulta de implante", "Cirurgia de implante", "Controle pós-operatório"],
  ["Tratamento de canal — sessão 1", "Tratamento de canal — sessão 2", "Avaliação endodôntica"],
];

// Horários de Brasília (UTC-3) convertidos para UTC.
function brazilTime(dayOffset: number, hhmm: string, base: Date) {
  const [h, m] = hhmm.split(":").map(Number);
  const shifted = new Date(base.getTime() - 3 * 3600_000);
  const utc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + dayOffset,
    h + 3,
    m
  );
  return new Date(utc);
}

function brazilWeekday(date: Date) {
  return new Date(date.getTime() - 3 * 3600_000).getUTCDay();
}

export async function runDemoSeed(prisma: PrismaClient) {
  // Migra a clínica de exemplo antiga para a nova empresa fictícia, se existir.
  const [legacy, current] = await Promise.all([
    prisma.clinic.findUnique({ where: { slug: LEGACY_SLUG } }),
    prisma.clinic.findUnique({ where: { slug: SLUG } }),
  ]);
  if (legacy && !current) {
    await prisma.clinic.update({ where: { id: legacy.id }, data: { slug: SLUG } });
  }

  const clinic = await prisma.clinic.upsert({
    where: { slug: SLUG },
    update: CLINIC,
    create: { ...CLINIC, slug: SLUG },
  });

  for (const h of HOURS) {
    await prisma.workingHour.upsert({
      where: { clinicId_dayOfWeek: { clinicId: clinic.id, dayOfWeek: h.day } },
      update: { startTime: h.start, endTime: h.end, isActive: h.active },
      create: {
        clinicId: clinic.id,
        dayOfWeek: h.day,
        startTime: h.start,
        endTime: h.end,
        isActive: h.active,
      },
    });
  }

  async function upsertUser(u: {
    legacyEmail?: string;
    email: string;
    name: string;
    role: Role;
    password: string;
  }) {
    if (u.legacyEmail) {
      const old = await prisma.user.findUnique({ where: { email: u.legacyEmail } });
      const taken = await prisma.user.findUnique({ where: { email: u.email } });
      if (old && !taken) {
        await prisma.user.update({ where: { id: old.id }, data: { email: u.email } });
      }
    }
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { name: u.name, role: u.role, clinicId: clinic.id, active: true },
      });
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    return prisma.user.create({
      data: { email: u.email, name: u.name, role: u.role, passwordHash, clinicId: clinic.id },
    });
  }

  for (const s of STAFF) await upsertUser(s);

  const dentistIds: string[] = [];
  for (const d of DENTISTS) {
    const user = await upsertUser({ ...d, role: Role.DENTIST, password: "dentista123" });
    const profile = {
      specialty: d.specialty,
      cro: d.cro,
      photoUrl: d.photoUrl,
      publicBio: d.publicBio,
      active: true,
      publicVisible: true,
    };
    const dentist = await prisma.dentist.upsert({
      where: { userId: user.id },
      update: profile,
      create: { ...profile, userId: user.id, clinicId: clinic.id },
    });
    dentistIds.push(dentist.id);
  }

  for (const [i, [name, description]] of SERVICES.entries()) {
    const existing = await prisma.service.findFirst({ where: { clinicId: clinic.id, name } });
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { description, order: i, active: true },
      });
    } else {
      await prisma.service.create({
        data: { clinicId: clinic.id, name, description, order: i },
      });
    }
  }

  const existingPatients = await prisma.patient.findMany({
    where: { clinicId: clinic.id, name: { in: PATIENTS.map(([n]) => n) } },
    select: { id: true, name: true },
  });
  const patientByName = new Map(existingPatients.map((p) => [p.name, p.id]));
  const patientIds: string[] = [];
  for (const [name, phone, email] of PATIENTS) {
    let patient = patientByName.has(name) ? { id: patientByName.get(name)! } : null;
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId: clinic.id,
          name,
          contacts: {
            create: [
              { type: "WHATSAPP", value: phone, isPrimary: true },
              ...(email ? [{ type: "EMAIL" as const, value: email }] : []),
            ],
          },
        },
      });
    }
    patientIds.push(patient.id);
  }

  // Agenda de demonstração com horários fixos relativos a "hoje". Os horários
  // já ocupados (qualquer status) são pulados, então rodar de novo no mesmo dia
  // não duplica nada; o teto evita crescer indefinidamente.
  const now = new Date();
  const windowStart = brazilTime(-6, "00:00", now);
  const windowEnd = brazilTime(11, "00:00", now);
  const [appointmentCount, taken] = await Promise.all([
    prisma.appointment.count({ where: { clinicId: clinic.id } }),
    prisma.appointment.findMany({
      where: { dentistId: { in: dentistIds }, startAt: { gte: windowStart, lt: windowEnd } },
      select: { dentistId: true, startAt: true, endAt: true },
    }),
  ]);

  const toCreate: {
    clinicId: string;
    dentistId: string;
    patientId: string;
    startAt: Date;
    endAt: Date;
    status: AppointmentStatus;
    notes: string;
  }[] = [];

  if (appointmentCount < 150) {
    const slots = ["09:00", "10:30", "14:00", "16:30"];
    let patientCursor = 0;

    for (let dayOffset = -6; dayOffset <= 10; dayOffset++) {
      const weekday = brazilWeekday(brazilTime(dayOffset, "12:00", now));
      if (weekday === 0) continue;
      const daySlots = weekday === 6 ? ["09:00", "10:30"] : slots;

      for (const [dentistIndex, dentistId] of dentistIds.entries()) {
        // Cada dentista atende em dias alternados para a agenda parecer real.
        if ((dayOffset + dentistIndex) % 2 !== 0) continue;

        for (const [slotIndex, slot] of daySlots.entries()) {
          if ((slotIndex + dentistIndex + dayOffset) % 3 === 0) continue;

          const startAt = brazilTime(dayOffset, slot, now);
          const endAt = new Date(startAt.getTime() + clinic.slotDurationMinutes * 60_000);
          const busy = [...taken, ...toCreate].some(
            (a) => a.dentistId === dentistId && a.startAt < endAt && a.endAt > startAt
          );
          if (busy) continue;

          let status: AppointmentStatus;
          if (startAt < now) {
            const roll = patientCursor % 9;
            status = roll === 4 ? "NO_SHOW" : roll === 7 ? "CANCELLED" : "COMPLETED";
          } else {
            status = patientCursor % 3 === 0 ? "SCHEDULED" : "CONFIRMED";
          }

          const notes = NOTES_BY_DENTIST[dentistIndex % NOTES_BY_DENTIST.length];
          toCreate.push({
            clinicId: clinic.id,
            dentistId,
            patientId: patientIds[patientCursor % patientIds.length],
            startAt,
            endAt,
            status,
            notes: notes[patientCursor % notes.length],
          });
          patientCursor++;
        }
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.appointment.createMany({ data: toCreate });
  }
  const createdAppointments = toCreate.length;

  const messageCount = await prisma.contactMessage.count({ where: { clinicId: clinic.id } });
  if (messageCount === 0) {
    await prisma.contactMessage.createMany({
      data: [
        {
          clinicId: clinic.id,
          name: "Renata Alves",
          phone: "(11) 97654-3210",
          message:
            "Olá! Gostaria de agendar uma avaliação para meu filho de 7 anos. Vocês atendem aos sábados?",
        },
        {
          clinicId: clinic.id,
          name: "Diego Fonseca",
          email: "diego.fonseca@email.com",
          message: "Bom dia, queria saber como funciona o clareamento e quantas sessões são necessárias.",
        },
      ],
    });
  }

  return {
    clinicSlug: clinic.slug,
    dentists: dentistIds.length,
    patients: patientIds.length,
    createdAppointments,
  };
}
