"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { whiteLabel } from "@/config/white-label";
import { ToothIcon } from "@/components/dental-icons";
import { NAV_ITEMS, activeHref } from "./nav-items";

export type ClinicSummary = { name: string; slug: string; logoUrl: string | null };

export function SidebarBrand({ clinic, inSheet }: { clinic: ClinicSummary; inSheet?: boolean }) {
  return (
    <Link href="/dashboard" className={cn("flex min-w-0 items-center gap-3 px-2", inSheet && "pr-10")}>
      {clinic.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={clinic.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint text-navy">
          <ToothIcon className="h-5 w-5" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-bold text-white">
          {clinic.name}
        </span>
        <span className="block text-xs text-white/60">Painel da clínica</span>
      </span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const current = activeHref(pathname);

  return (
    <nav className="flex flex-col gap-1" aria-label="Menu do painel">
      {NAV_ITEMS.map((item) => {
        const active = item.href === current;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/15 text-white shadow-[inset_3px_0_0_hsl(var(--brand-accent))]"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarContent({
  clinic,
  onNavigate,
  inSheet,
}: {
  clinic: ClinicSummary;
  onNavigate?: () => void;
  /** No menu do celular, reserva espaço para o botão de fechar. */
  inSheet?: boolean;
}) {
  return (
    <div className="flex h-full flex-col gap-8 bg-navy px-3 py-5">
      <SidebarBrand clinic={clinic} inSheet={inSheet} />
      <SidebarNav onNavigate={onNavigate} />
      <p className="mt-auto px-3 text-xs text-white/40">{whiteLabel.productName}</p>
    </div>
  );
}
