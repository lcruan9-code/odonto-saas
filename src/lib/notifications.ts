import { formatDateTime } from "@/lib/dates";

interface AppointmentNotificationPayload {
  patientName: string;
  clinicName: string;
  dentistName: string;
  startAt: Date;
}

// Abstração de notificações. Hoje registra em log; para produção, plugar um
// provedor de e-mail (ex: Resend, SES) e de WhatsApp (ex: Meta Cloud API, Twilio)
// mantendo a mesma assinatura de função.
export async function notifyAppointmentCreated(payload: AppointmentNotificationPayload) {
  const when = formatDateTime(payload.startAt);

  const message = `Olá ${payload.patientName}, seu agendamento na ${payload.clinicName} com ${payload.dentistName} foi confirmado para ${when}.`;

  console.log("[notificacao:agendamento]", message);
}
