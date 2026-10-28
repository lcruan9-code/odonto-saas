import type { Prisma } from "@prisma/client";

// Dados estritamente públicos: nenhum paciente, agendamento, e-mail pessoal
// ou id interno de usuário. Usado pelo site da clínica e pela prévia do painel.
export const publicClinicSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  coverImageUrl: true,
  aboutImageUrl: true,
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  ctaText: true,
  published: true,
  phone: true,
  email: true,
  address: true,
  services: {
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, description: true },
  },
  dentists: {
    where: { active: true, publicVisible: true },
    orderBy: { user: { name: "asc" } },
    select: {
      id: true,
      specialty: true,
      cro: true,
      publicBio: true,
      photoUrl: true,
      user: { select: { name: true } },
    },
  },
  workingHours: {
    where: { isActive: true },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  },
} satisfies Prisma.ClinicSelect;

export type PublicClinic = Prisma.ClinicGetPayload<{ select: typeof publicClinicSelect }>;

/** Tipo das mensagens trocadas entre a Administração e o iframe da prévia. */
export const PREVIEW_MESSAGE = "clinic-preview";

/** Campos que a prévia do painel pode sobrescrever antes de salvar. */
export const PREVIEW_FIELDS = [
  "name",
  "phone",
  "email",
  "address",
  "description",
  "logoUrl",
  "coverImageUrl",
  "aboutImageUrl",
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "ctaText",
] as const;

export type ClinicDraft = Partial<Record<(typeof PREVIEW_FIELDS)[number], string | null>>;
