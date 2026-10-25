import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAY_LABELS: Record<string, string> = {
  SUNDAY: "Domingo",
  MONDAY: "Segunda-feira",
  TUESDAY: "Terça-feira",
  WEDNESDAY: "Quarta-feira",
  THURSDAY: "Quinta-feira",
  FRIDAY: "Sexta-feira",
  SATURDAY: "Sábado",
};

export default async function HorariosPage() {
  const session = await getServerSession(authOptions);
  const workingHours = await prisma.workingHour.findMany({
    where: { clinicId: session!.user.clinicId },
    orderBy: { dayOfWeek: "asc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Horário de funcionamento</h1>
      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Dia da semana</th>
              <th className="p-3">Início</th>
              <th className="p-3">Fim</th>
              <th className="p-3">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {workingHours.map((wh) => (
              <tr key={wh.id} className="border-t">
                <td className="p-3">{DAY_LABELS[wh.dayOfWeek]}</td>
                <td className="p-3">{wh.startTime}</td>
                <td className="p-3">{wh.endTime}</td>
                <td className="p-3">{wh.isActive ? "Sim" : "Não"}</td>
              </tr>
            ))}
            {workingHours.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-slate-500">
                  Nenhum horário configurado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
