import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewPatientForm } from "./new-patient-form";
import { PatientRow } from "./patient-row";

export default async function PacientesPage() {
  const session = await getServerSession(authOptions);
  const patients = await prisma.patient.findMany({
    where: { clinicId: session!.user.clinicId },
    include: { contacts: true },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Pacientes</h1>

      <div className="mb-4">
        <NewPatientForm />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Contatos</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <PatientRow
                key={p.id}
                patient={{
                  id: p.id,
                  name: p.name,
                  notes: p.notes,
                  contacts: p.contacts.map((c) => ({ value: c.value })),
                }}
              />
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-center text-slate-500">
                  Nenhum paciente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
