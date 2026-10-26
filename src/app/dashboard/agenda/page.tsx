import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppointmentRow } from "./appointment-row";
import { NewAppointmentForm } from "./new-appointment-form";

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  const clinicId = session!.user.clinicId;

  const [appointments, patients, dentists, clinic] = await Promise.all([
    prisma.appointment.findMany({
      where: { clinicId },
      include: { patient: true, dentist: { include: { user: true } } },
      orderBy: { startAt: "asc" },
      take: 50,
    }),
    prisma.patient.findMany({ where: { clinicId }, orderBy: { name: "asc" } }),
    prisma.dentist.findMany({
      where: { clinicId, active: true },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.clinic.findUnique({ where: { id: clinicId } }),
  ]);

  const dentistOptions = dentists.map((d) => ({ id: d.id, name: d.user.name }));
  const patientOptions = patients.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agenda</h1>
      </div>

      <div className="mb-4">
        <NewAppointmentForm
          patients={patientOptions}
          dentists={dentistOptions}
          slotDurationMinutes={clinic?.slotDurationMinutes ?? 30}
        />
      </div>

      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Data/Hora</th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Dentista</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={{
                  id: a.id,
                  startAt: a.startAt.toISOString(),
                  status: a.status,
                  patient: { name: a.patient.name },
                  dentist: { id: a.dentist.id, user: { name: a.dentist.user.name } },
                }}
                dentists={dentistOptions}
                slotDurationMinutes={clinic?.slotDurationMinutes ?? 30}
              />
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-slate-500">
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
