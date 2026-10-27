import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida, use o formato #RRGGBB")
  .optional()
  .or(z.literal(""));

// Aceita http(s) ou caminho local do próprio site ("/images/..."), recusando
// "//host" (protocol-relative) e esquemas como javascript:/data:.
const safeImageUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || /^https?:\/\//i.test(value) || /^\/(?!\/)[\w\-./]+$/.test(value),
    "Use uma URL http(s):// ou um caminho local como /images/foto.jpg"
  );

export const patientSchema = z.object({
  name: z.string().min(2),
  cpf: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  contacts: z
    .array(
      z.object({
        type: z.enum(["PHONE", "WHATSAPP", "EMAIL"]),
        value: z.string().min(3),
        isPrimary: z.boolean().optional(),
      })
    )
    .optional(),
});

export const appointmentSchema = z.object({
  patientId: z.string().min(1),
  dentistId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().optional(),
});

export const appointmentUpdateSchema = z.object({
  dentistId: z.string().min(1).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
  notes: z.string().optional(),
});

export const patientUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  cpf: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const dentistCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  specialty: z.string().optional(),
  cro: z.string().optional(),
});

export const dentistUpdateSchema = z.object({
  specialty: z.string().optional(),
  cro: z.string().optional(),
  active: z.boolean().optional(),
  publicVisible: z.boolean().optional(),
  publicBio: z.string().max(1000).optional(),
  photoUrl: safeImageUrl,
});

export const clinicUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  slotDurationMinutes: z.coerce.number().int().min(5).max(240).optional(),
});

export const clinicBrandingSchema = z.object({
  description: z.string().max(500).optional(),
  logoUrl: safeImageUrl,
  coverImageUrl: safeImageUrl,
  aboutImageUrl: safeImageUrl,
  primaryColor: hexColor,
  secondaryColor: hexColor,
  accentColor: hexColor,
  ctaText: z.string().max(60).optional(),
});

export const clinicPublishSchema = z.object({
  published: z.boolean(),
});

export const clinicFullUpdateSchema = clinicUpdateSchema
  .merge(clinicBrandingSchema)
  .merge(clinicPublishSchema.partial());

export const serviceCreateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

export const serviceUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  active: z.boolean().optional(),
  order: z.coerce.number().int().min(0).max(9999).optional(),
});

// Honeypot ("website") deve vir vazio; bots costumam preencher todo campo.
export const contactMessageSchema = z.object({
  clinicId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(2000),
  website: z.string().max(0).optional().or(z.literal("")),
});

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido (HH:MM)");

export const dentistScheduleDaySchema = z
  .object({
    dayOfWeek: z.enum(DAYS),
    startTime: hhmm,
    endTime: hhmm,
    breakStart: hhmm.nullable().optional(),
    breakEnd: hhmm.nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.startTime < d.endTime, "Fim deve ser depois do início")
  .refine(
    (d) => !d.breakStart === !d.breakEnd,
    "Informe início e fim do intervalo, ou deixe os dois vazios"
  )
  .refine(
    (d) =>
      !d.breakStart ||
      !d.breakEnd ||
      (d.startTime < d.breakStart && d.breakStart < d.breakEnd && d.breakEnd < d.endTime),
    "O intervalo precisa estar dentro do expediente"
  );

// Grade completa da semana (substitui a anterior do profissional).
export const dentistScheduleSchema = z
  .array(dentistScheduleDaySchema)
  .max(7)
  .refine(
    (days) => new Set(days.map((d) => d.dayOfWeek)).size === days.length,
    "Dia da semana repetido"
  );

export const timeBlockSchema = z
  .object({
    dentistId: z.string().min(1).nullable(),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((b) => b.endAt > b.startAt, "Fim deve ser depois do início");

export const workingHourSchema = z.object({
  dayOfWeek: z.enum([
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().optional(),
});
