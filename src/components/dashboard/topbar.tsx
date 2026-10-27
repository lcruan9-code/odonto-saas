"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, ExternalLink, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent, type ClinicSummary } from "./sidebar";
import { NAV_ITEMS, ROLE_LABELS, activeHref } from "./nav-items";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Topbar({
  clinic,
  user,
}: {
  clinic: ClinicSummary;
  user: { name: string; email: string; role: string };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) => i.href === activeHref(pathname));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-none p-0 [&>button]:text-white">
          <SheetTitle className="sr-only">Menu do painel</SheetTitle>
          <SidebarContent clinic={clinic} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <h1 className="truncate text-base font-semibold sm:text-lg">{current?.label ?? "Painel"}</h1>

      <div className="ml-auto flex items-center gap-2">
        {clinic.slug && (
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <a href={`/clinica/${clinic.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink />
              Ver site
            </a>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-navy text-xs text-white">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[10rem] truncate text-left text-sm md:block">
                {user.name}
              </span>
              <ChevronDown className="hidden text-muted-foreground md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {clinic.slug && (
              <DropdownMenuItem asChild className="sm:hidden">
                <a href={`/clinica/${clinic.slug}`} target="_blank" rel="noreferrer">
                  <ExternalLink />
                  Ver site da clínica
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
