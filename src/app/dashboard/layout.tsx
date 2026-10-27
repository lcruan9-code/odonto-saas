import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { SidebarContent } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { name: true, slug: true, logoUrl: true },
  });
  const clinicSummary = clinic ?? { name: "Clínica", slug: "", logoUrl: null };

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarContent clinic={clinicSummary} />
      </aside>
      <div className="lg:pl-64">
        <Topbar
          clinic={clinicSummary}
          user={{
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            role: session.user.role,
          }}
        />
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
