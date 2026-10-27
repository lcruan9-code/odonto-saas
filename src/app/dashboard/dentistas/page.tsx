import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewDentistForm } from "./new-dentist-form";
import { DentistRow } from "./dentist-row";

export default async function DentistasPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const dentists = await prisma.dentist.findMany({
    where: { clinicId: session!.user.clinicId },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Dentistas</h1>

      {isAdmin ? (
        <div className="mb-4">
          <NewDentistForm />
        </div>
      ) : (
        <p className="mb-4 text-sm text-slate-500">
          Apenas administradores podem cadastrar ou desativar dentistas.
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Especialidade</th>
              <th className="p-3">CRO</th>
              <th className="p-3">Status</th>
              <th className="p-3">Site público</th>
              {isAdmin && <th className="p-3">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {dentists.map((d) =>
              isAdmin ? (
                <DentistRow
                  key={d.id}
                  dentist={{
                    id: d.id,
                    active: d.active,
                    publicVisible: d.publicVisible,
                    publicBio: d.publicBio,
                    photoUrl: d.photoUrl,
                    specialty: d.specialty,
                    cro: d.cro,
                    user: { name: d.user.name, email: d.user.email },
                  }}
                />
              ) : (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.user.name}</td>
                  <td className="p-3">{d.user.email}</td>
                  <td className="p-3">{d.specialty || "—"}</td>
                  <td className="p-3">{d.cro || "—"}</td>
                  <td className="p-3">{d.active ? "Ativo" : "Inativo"}</td>
                  <td className="p-3">{d.publicVisible ? "Visível" : "Oculto"}</td>
                </tr>
              )
            )}
            {dentists.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="p-3 text-center text-slate-500">
                  Nenhum dentista cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
