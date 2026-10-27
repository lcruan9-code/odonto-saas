"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type FilterFn,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, MessageCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { whatsappLink } from "@/lib/whatsapp";
import { StatusBadge, STATUS_LABELS } from "../status-badge";
import { selectClass } from "../agenda/create-dialog";
import { NewPatientDialog } from "./new-patient-dialog";
import { PatientSheet } from "./patient-sheet";

export type PatientRow = {
  id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  appointmentCount: number;
  lastService: string | null;
  lastAt: string | null;
  lastDentistId: string | null;
  lastDentistName: string | null;
  lastDentistColor: string | null;
  lastStatus: string | null;
};

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Busca por nome (sem acento) ou pelos dígitos do telefone.
const searchFilter: FilterFn<PatientRow> = (row, _columnId, query: string) => {
  const q = normalize(query.trim());
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    normalize(row.original.name).includes(q) ||
    (!!row.original.email && row.original.email.toLowerCase().includes(q)) ||
    (digits.length >= 3 && !!row.original.whatsapp?.replace(/\D/g, "").includes(digits))
  );
};

function SortButton({
  label,
  sorted,
  onClick,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onClick: () => void;
}) {
  const Icon = sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function PatientsTable({
  data,
  dentists,
}: {
  data: PatientRow[];
  dentists: { id: string; name: string }[];
}) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "lastAt", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [status, setStatus] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
      data.filter(
        (p) =>
          (!status || (status === "NONE" ? !p.lastStatus : p.lastStatus === status)) &&
          (!dentistId || p.lastDentistId === dentistId)
      ),
    [data, status, dentistId]
  );

  const columns = useMemo<ColumnDef<PatientRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortButton label="Nome" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.appointmentCount} consulta(s)
            </p>
          </div>
        ),
      },
      {
        id: "whatsapp",
        header: "WhatsApp",
        enableSorting: false,
        cell: ({ row }) =>
          row.original.whatsapp ? (
            <a
              href={whatsappLink(row.original.whatsapp, `Olá, ${row.original.name.split(" ")[0]}!`)}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Abrir WhatsApp de ${row.original.name}`}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {row.original.whatsapp}
            </a>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "lastService",
        header: "Último serviço",
        enableSorting: false,
        cell: ({ getValue }) => getValue<string | null>() ?? <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: "lastAt",
        header: ({ column }) => (
          <SortButton label="Data/Hora" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
        ),
        sortingFn: (a, b) =>
          (a.original.lastAt ?? "").localeCompare(b.original.lastAt ?? ""),
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value ? (
            <span className="whitespace-nowrap">{formatDateTime(value)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "lastDentistName",
        header: ({ column }) => (
          <SortButton label="Profissional" sorted={column.getIsSorted()} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) =>
          row.original.lastDentistName ? (
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: row.original.lastDentistColor ?? undefined }}
              />
              {row.original.lastDentistName}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "lastStatus",
        header: "Status",
        enableSorting: false,
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value ? <StatusBadge status={value} /> : <span className="text-xs text-muted-foreground">Sem consultas</span>;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: searchFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">{data.length} cadastrado(s)</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo paciente
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr,auto,auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar paciente"
            placeholder="Buscar por nome, telefone ou e-mail"
            className="pl-9"
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              table.setPageIndex(0);
            }}
          />
        </div>
        <select
          aria-label="Filtrar por status"
          className={`${selectClass} sm:w-44`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            table.setPageIndex(0);
          }}
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="NONE">Sem consultas</option>
        </select>
        <select
          aria-label="Filtrar por profissional"
          className={`${selectClass} sm:w-52`}
          value={dentistId}
          onChange={(e) => {
            setDentistId(e.target.value);
            table.setPageIndex(0);
          }}
        >
          <option value="">Todos os profissionais</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table className="min-w-[860px]">
          <TableHeader className="bg-slate-50">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-patient={row.original.name}
                className="cursor-pointer"
                onClick={() => setOpenId(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {total === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {total === 0
            ? "0 resultados"
            : `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, total)} de ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <select
            aria-label="Itens por página"
            className={`${selectClass} h-9 w-auto`}
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próxima página"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <PatientSheet patientId={openId} onClose={() => setOpenId(null)} />
      <NewPatientDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
