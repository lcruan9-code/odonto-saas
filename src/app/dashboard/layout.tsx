import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const clinic = session
    ? await prisma.clinic.findUnique({
        where: { id: session.user.clinicId },
        select: { name: true, slug: true },
      })
    : null;

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <DashboardNav
        clinicName={clinic?.name ?? "Clínica"}
        clinicSlug={clinic?.slug ?? ""}
        userName={session?.user.name ?? ""}
        role={session?.user.role ?? ""}
      />
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
