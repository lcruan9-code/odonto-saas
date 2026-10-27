import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DentistsManager } from "./dentists-manager";

export default async function DentistasPage() {
  const session = await requireSession();
  const clinicId = session.user.clinicId;

  const [dentists, upcoming] = await Promise.all([
    prisma.dentist.findMany({
      where: { clinicId },
      include: { user: { select: { name: true, email: true } }, schedules: true },
      orderBy: [{ active: "desc" }, { user: { name: "asc" } }],
    }),
    prisma.appointment.groupBy({
      by: ["dentistId"],
      where: { clinicId, startAt: { gte: new Date() }, status: { notIn: ["CANCELLED"] } },
      _count: { _all: true },
    }),
  ]);
  const upcomingByDentist = new Map(upcoming.map((u) => [u.dentistId, u._count._all]));

  return (
    <DentistsManager
      canEdit={session.user.role === "ADMIN"}
      dentists={dentists.map((d) => ({
        id: d.id,
        name: d.user.name,
        email: d.user.email,
        specialty: d.specialty,
        cro: d.cro,
        color: d.color,
        photoUrl: d.photoUrl,
        publicBio: d.publicBio,
        publicVisible: d.publicVisible,
        active: d.active,
        upcoming: upcomingByDentist.get(d.id) ?? 0,
        schedules: d.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          breakStart: s.breakStart,
          breakEnd: s.breakEnd,
          isActive: s.isActive,
        })),
      }))}
    />
  );
}
