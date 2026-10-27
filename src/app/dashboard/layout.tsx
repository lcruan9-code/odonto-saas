import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/pacientes", label: "Pacientes" },
  { href: "/dashboard/dentistas", label: "Dentistas" },
  { href: "/dashboard/horarios", label: "Horários" },
  { href: "/dashboard/administracao", label: "Administração" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-white p-4">
        <p className="mb-6 text-lg font-bold">Odonto SaaS</p>
        <nav className="flex flex-col gap-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <span className="text-sm text-slate-600">{session?.user.name}</span>
          <SignOutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
