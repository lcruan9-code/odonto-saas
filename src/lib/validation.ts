import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida, use o formato #RRGGBB")
  .optional()
  .or(z.literal(""));

// Aceita apenas http(s) e recusa URLs absurdamente longas; evita depender de
// um serviço de upload que o projeto ainda não tem configurado.
const safeImageUrl = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .or(z.literal(""))
  .refine(
    (value) => !value || /^https?:\/\//i.test(value),
    "A URL da imagem deve começar com http:// ou https://"
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
