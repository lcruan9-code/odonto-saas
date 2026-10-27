"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// FullCalendar depende do DOM: carrega só no navegador.
export const AgendaCalendar = dynamic(() => import("./agenda-calendar"), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-2xl" />,
});
