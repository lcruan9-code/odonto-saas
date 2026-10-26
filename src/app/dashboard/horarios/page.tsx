import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkingHourRow } from "./working-hour-row";

const DAYS: { value: string; label: string }[] = [
  { value: "MONDAY", label: "Segunda-feira" },
  { value: "TUESDAY", label: "Terça-feira" },
  { value: "WEDNESDAY", label: "Quarta-feira" },
  { value: "THURSDAY", label: "Quinta-feira" },
  { value: "FRIDAY", label: "Sexta-feira" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

export default async function HorariosPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const workingHours = await prisma.workingHour.findMany({
    where: { clinicId: session!.user.clinicId },
  });

  const byDay = new Map(workingHours.map((wh) => [wh.dayOfWeek as string, wh]));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Horário de funcionamento</h1>
      {!isAdmin && (
        <p className="mb-4 text-sm text-slate-500">
          Apenas administradores podem alterar os horários.
        </p>
      )}
      <div className="overflow-hidden rounded-md border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Dia da semana</th>
              <th className="p-3">Início</th>
              <th className="p-3">Fim</th>
              <th className="p-3">Ativo</th>
              {isAdmin && <th className="p-3">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day) => {
              const existing = byDay.get(day.value);
              return (
                <WorkingHourRow
                  key={day.value}
                  dayOfWeek={day.value}
                  label={day.label}
                  initialStartTime={existing?.startTime ?? "08:00"}
                  initialEndTime={existing?.endTime ?? "18:00"}
                  initialActive={existing?.isActive ?? false}
                  canEdit={isAdmin}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
