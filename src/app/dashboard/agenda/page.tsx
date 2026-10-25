import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AgendaPage() {
  const session = await getServerSession(authOptions);
  const appointments = await prisma.appointment.findMany({
    where: { clinicId: session!.user.clinicId },
    include: { patient: true, dentist: { include: { user: true } } },
    orderBy: { startAt: "asc" },
    take: 20,
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Agenda</h1>
      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Data/Hora</th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Dentista</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3">{a.startAt.toLocaleString("pt-BR")}</td>
                <td className="p-3">{a.patient.name}</td>
                <td className="p-3">{a.dentist.user.name}</td>
                <td className="p-3">{a.status}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-slate-500">
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
