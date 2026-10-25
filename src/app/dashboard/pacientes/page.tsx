import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">Contatos</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.name}</td>
                <td className="p-3">
                  {p.contacts.map((c) => c.value).join(", ") || "—"}
                </td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr>
                <td colSpan={2} className="p-3 text-center text-slate-500">
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
