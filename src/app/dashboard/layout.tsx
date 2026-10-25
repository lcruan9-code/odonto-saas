import Link from "next/link";

const NAV = [
  { href: "/dashboard/agenda", label: "Agenda" },
  { href: "/dashboard/pacientes", label: "Pacientes" },
  { href: "/dashboard/horarios", label: "Horários" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
