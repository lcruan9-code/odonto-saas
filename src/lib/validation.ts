import { z } from "zod";

export const patientSchema = z.object({
  clinicId: z.string().min(1),
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
  clinicId: z.string().min(1),
  patientId: z.string().min(1),
  dentistId: z.string().min(1),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  notes: z.string().optional(),
});

export const workingHourSchema = z.object({
  clinicId: z.string().min(1),
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
