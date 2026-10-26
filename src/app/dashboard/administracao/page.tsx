import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClinicSettingsForm } from "./clinic-settings-form";

export default async function AdministracaoPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const [clinic, userCount, dentistCount, patientCount, appointmentCount] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: session!.user.clinicId } }),
    prisma.user.count({ where: { clinicId: session!.user.clinicId } }),
    prisma.dentist.count({ where: { clinicId: session!.user.clinicId, active: true } }),
    prisma.patient.count({ where: { clinicId: session!.user.clinicId } }),
    prisma.appointment.count({ where: { clinicId: session!.user.clinicId } }),
  ]);

  if (!clinic) return null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Administração</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Usuários", value: userCount },
          { label: "Dentistas ativos", value: dentistCount },
          { label: "Pacientes", value: patientCount },
          { label: "Agendamentos", value: appointmentCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border bg-white p-4">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-medium">Dados da clínica</h2>
      {!isAdmin && (
        <p className="mb-2 text-sm text-slate-500">
          Apenas administradores podem editar os dados da clínica.
        </p>
      )}
      <ClinicSettingsForm
        clinic={{
          name: clinic.name,
          phone: clinic.phone,
          email: clinic.email,
          address: clinic.address,
          slotDurationMinutes: clinic.slotDurationMinutes,
        }}
        canEdit={isAdmin}
      />
    </div>
  );
}
