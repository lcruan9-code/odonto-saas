import Link from "next/link";
import { LockIcon, MailIcon, MapPinIcon, PhoneIcon, ToothIcon } from "@/components/dental-icons";

type ClinicBrand = {
  name: string;
  slug: string;
  logoUrl: string | null;
};

export function ClinicLogo({
  clinic,
  primary,
  light = false,
}: {
  clinic: ClinicBrand;
  primary: string;
  light?: boolean;
}) {
  return (
    <Link href={`/clinica/${clinic.slug}`} className="flex min-w-0 items-center gap-2.5">
      {clinic.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={clinic.logoUrl}
          alt={`Logo ${clinic.name}`}
          className="h-10 w-10 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            light ? "bg-white/15 text-white" : "text-white"
          }`}
          style={light ? undefined : { backgroundColor: primary }}
        >
          <ToothIcon className="h-6 w-6" />
        </span>
      )}
      <span
        className={`truncate font-display text-base font-bold leading-tight sm:text-lg ${
          light ? "text-white" : "text-slate-900"
        }`}
      >
        {clinic.name}
      </span>
    </Link>
  );
}

export function SiteHeader({
  clinic,
  primary,
  variant,
  links = [],
}: {
  clinic: ClinicBrand;
  primary: string;
  variant: "home" | "booking";
  links?: { href: string; label: string }[];
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <ClinicLogo clinic={clinic} primary={primary} />

        {variant === "home" && links.length > 0 && (
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 lg:flex">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-slate-900">
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {variant === "booking" && (
            <Link
              href={`/clinica/${clinic.slug}`}
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:inline-flex"
            >
              ← Voltar ao site
            </Link>
          )}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <LockIcon className="h-4 w-4" />
            <span className="sm:hidden">Entrar</span>
            <span className="hidden sm:inline">Área da clínica</span>
          </Link>
          {variant === "home" && (
            <Link
              href={`/agendar/${clinic.slug}`}
              className="hidden rounded-full px-5 py-2.5 text-sm font-semibold text-white md:inline-flex"
              style={{ backgroundColor: primary }}
            >
              Agendar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({
  clinic,
  primary,
}: {
  clinic: ClinicBrand & {
    description: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  primary: string;
}) {
  return (
    <footer className="text-white" style={{ backgroundColor: primary }}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <div>
          <ClinicLogo clinic={clinic} primary={primary} light />
          {clinic.description && (
            <p className="mt-4 max-w-xs text-sm text-white/75">{clinic.description}</p>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            Navegação
          </h3>
          <ul className="flex flex-col gap-2 text-sm text-white/85">
            <li>
              <Link href={`/clinica/${clinic.slug}`} className="hover:text-white">
                Início
              </Link>
            </li>
            <li>
              <Link href={`/agendar/${clinic.slug}`} className="hover:text-white">
                Agendamento online
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white">
                Área da clínica (equipe)
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            Contato
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm text-white/85">
            {clinic.phone && (
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0" />
                <a href={`tel:${clinic.phone.replace(/\D/g, "")}`}>{clinic.phone}</a>
              </li>
            )}
            {clinic.email && (
              <li className="flex items-center gap-2">
                <MailIcon className="h-4 w-4 shrink-0" />
                <a href={`mailto:${clinic.email}`} className="break-all">
                  {clinic.email}
                </a>
              </li>
            )}
            {clinic.address && (
              <li className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{clinic.address}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} {clinic.name}. Agendamento online por Odonto SaaS.
      </div>
    </footer>
  );
}
