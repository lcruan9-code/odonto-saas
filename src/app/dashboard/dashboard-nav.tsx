"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  CalendarIcon,
  ClockIcon,
  CloseIcon,
  HomeIcon,
  MenuIcon,
  SettingsIcon,
  StethoscopeIcon,
  ToothIcon,
  UsersIcon,
} from "@/components/dental-icons";

const NAV = [
  { href: "/dashboard", label: "Início", icon: HomeIcon },
  { href: "/dashboard/agenda", label: "Agenda", icon: CalendarIcon },
  { href: "/dashboard/pacientes", label: "Pacientes", icon: UsersIcon },
  { href: "/dashboard/dentistas", label: "Dentistas", icon: StethoscopeIcon },
  { href: "/dashboard/horarios", label: "Horários", icon: ClockIcon },
  { href: "/dashboard/administracao", label: "Administração", icon: SettingsIcon },
];

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador(a)",
  DENTIST: "Dentista",
  RECEPTIONIST: "Recepção",
};

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function DashboardNav({
  clinicName,
  clinicSlug,
  userName,
  role,
}: {
  clinicName: string;
  clinicSlug: string;
  userName: string;
  role: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const links = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
      <Link
        href={`/clinica/${clinicSlug}`}
        target="_blank"
        className="rounded-xl px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
      >
        Ver site da clínica ↗
      </Link>
      <div className="flex items-center justify-between gap-2 px-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="text-xs text-white/60">{ROLE_LABELS[role] ?? role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-white hover:bg-white/10"
        >
          Sair
        </button>
      </div>
    </div>
  );

  const brand = (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-navy">
        <ToothIcon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-bold text-white">{clinicName}</p>
        <p className="text-xs text-white/60">Painel da clínica</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between self-start bg-navy p-4 lg:flex">
        <div className="flex flex-col gap-6">
          {brand}
          {links}
        </div>
        {footer}
      </aside>

      {/* Mobile */}
      <div className="sticky top-0 z-30 bg-navy lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          {brand}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="rounded-lg p-2 text-white hover:bg-white/10"
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
        {open && (
          <div className="flex flex-col gap-4 border-t border-white/10 px-4 pb-4 pt-3">
            {links}
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
