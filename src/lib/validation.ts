import { z } from "zod";

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
});

export const clinicUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  slotDurationMinutes: z.coerce.number().int().min(5).max(240).optional(),
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
