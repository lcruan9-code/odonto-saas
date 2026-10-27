import { CalendarDays, LayoutDashboard, Settings, Stethoscope, Users } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dashboard/dentistas", label: "Profissionais", icon: Stethoscope },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: Users },
  { href: "/dashboard/administracao", label: "Administração", icon: Settings },
];

// Rotas que não estão no menu, mas pertencem a uma seção dele.
const SECTION_ALIASES: Record<string, string> = {
  "/dashboard/horarios": "/dashboard/administracao",
};

export function activeHref(pathname: string) {
  const path = SECTION_ALIASES[pathname] ?? pathname;
  return (
    NAV_ITEMS.filter((i) => (i.href === "/dashboard" ? path === i.href : path.startsWith(i.href)))
      .map((i) => i.href)
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador(a)",
  DENTIST: "Dentista",
  RECEPTIONIST: "Recepção",
};
