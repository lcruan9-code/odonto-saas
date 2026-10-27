import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  SERVICE_ICONS,
  ToothIcon,
  UserIcon,
} from "@/components/dental-icons";
import { SiteFooter, SiteHeader } from "@/components/clinic-site";
import { ContactForm } from "./contact-form";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Segunda",
  TUESDAY: "Terça",
  WEDNESDAY: "Quarta",
  THURSDAY: "Quinta",
  FRIDAY: "Sexta",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};
const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

// Dados estritamente públicos: nenhum paciente, agendamento, e-mail pessoal
// ou id interno é renderizado a partir desta consulta.
const getPublicClinic = cache(async (slug: string) => {
  return prisma.clinic.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      coverImageUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      ctaText: true,
      published: true,
      phone: true,
      email: true,
      address: true,
      services: {
        where: { active: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, description: true },
      },
      dentists: {
        where: { active: true, publicVisible: true },
        orderBy: { user: { name: "asc" } },
        select: {
          id: true,
          specialty: true,
          cro: true,
          publicBio: true,
          photoUrl: true,
          user: { select: { name: true } },
        },
      },
      workingHours: {
        where: { isActive: true },
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const clinic = await getPublicClinic(params.slug);
  if (!clinic || !clinic.published) {
    return { title: "Clínica não encontrada" };
  }
  return {
    title: clinic.name,
    description: clinic.description ?? `Agendamento online em ${clinic.name}.`,
  };
}

function summarizeDays(days: string[]) {
  const sorted = DAY_ORDER.filter((d) => days.includes(d));
  if (sorted.length === 0) return null;
  const first = DAY_LABELS[sorted[0]].toLowerCase();
  const last = DAY_LABELS[sorted[sorted.length - 1]].toLowerCase();
  return sorted.length === 1 ? first : `${first} a ${last}`;
}

export default async function ClinicHomePage({ params }: { params: { slug: string } }) {
  const clinic = await getPublicClinic(params.slug);
  if (!clinic) notFound();

  let isPreview = false;
  if (!clinic.published) {
    const session = await getServerSession(authOptions);
    if (session?.user.clinicId !== clinic.id) notFound();
    isPreview = true;
  }

  const primary = clinic.primaryColor || "#0A2B4E";
  const secondary = clinic.secondaryColor || "#007A8A";
  const accent = clinic.accentColor || "#3BBEB8";
  const ctaText = clinic.ctaText || "Agende sua Consulta";
  const palette = [primary, secondary, accent];
  const bookingHref = `/agendar/${clinic.slug}`;

  const sortedHours = [...clinic.workingHours].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );
  const daysSummary = summarizeDays(sortedHours.map((h) => h.dayOfWeek));
  const featured = clinic.dentists.find((d) => d.photoUrl);

  const navLinks = [
    ...(clinic.services.length > 0 ? [{ href: "#servicos", label: "Serviços" }] : []),
    { href: "#como-funciona", label: "Como funciona" },
    ...(clinic.dentists.length > 0 ? [{ href: "#equipe", label: "Equipe" }] : []),
    { href: "#contato", label: "Contato" },
  ];

  const highlights = [
    clinic.dentists.length > 0
      ? `${clinic.dentists.length} ${clinic.dentists.length === 1 ? "especialista" : "especialistas"}`
      : null,
    daysSummary ? `Atendimento de ${daysSummary}` : null,
    "Agendamento online",
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {isPreview && (
        <div className="bg-amber-100 p-2 text-center text-sm text-amber-800">
          Prévia — este site ainda não foi publicado. Só administradores da clínica veem esta
          página.
        </div>
      )}

      <SiteHeader clinic={clinic} primary={primary} variant="home" links={navLinks} />

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundImage: `linear-gradient(120deg, ${primary} 0%, ${secondary} 60%, ${accent} 100%)` }}
      >
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: accent }}
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-12 pt-10 sm:px-6 md:grid-cols-2 md:py-20">
          <div className="text-white">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              <ToothIcon className="h-4 w-4" /> Odontologia
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {clinic.name}
            </h1>
            {clinic.description && (
              <p className="mt-4 max-w-lg text-base text-white/90 sm:text-lg">{clinic.description}</p>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={bookingHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-semibold shadow-lg shadow-black/10 transition hover:translate-y-[-1px]"
                style={{ color: primary }}
              >
                <CalendarIcon className="h-5 w-5" />
                {ctaText}
              </Link>
              <a
                href="#contato"
                className="inline-flex items-center justify-center rounded-full px-6 py-3.5 font-medium text-white ring-1 ring-white/40 hover:bg-white/10"
              >
                Fale conosco
              </a>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/90">
              {highlights.map((h) => (
                <li key={h} className="flex items-center gap-1.5">
                  <CheckIcon className="h-4 w-4" />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            {clinic.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinic.coverImageUrl}
                alt={`Atendimento em ${clinic.name}`}
                className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl ring-4 ring-white/20 md:aspect-square"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[2rem] bg-white/10 shadow-2xl ring-1 ring-white/20 md:aspect-square">
                <ToothIcon className="h-24 w-24 text-white/80" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Serviços */}
      {clinic.services.length > 0 && (
        <section id="servicos" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: secondary }}>
                Tratamentos
              </p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Nossos Serviços</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.services.map((service, i) => {
                const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                const color = palette[i % palette.length];
                return (
                  <div
                    key={service.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1.5 text-lg font-semibold">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm leading-relaxed text-slate-600">{service.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Como funciona */}
      <section id="como-funciona" className="scroll-mt-20 bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          {featured?.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.photoUrl}
              alt={featured.user.name}
              className="order-last mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] object-cover shadow-xl md:order-first"
            />
          )}
          <div className={featured?.photoUrl ? "" : "md:col-span-2 md:mx-auto md:max-w-2xl"}>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: secondary }}>
              Agendamento online
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Sua consulta em 3 passos</h2>
            <p className="mt-3 text-slate-600">
              Sem ligação e sem fila: escolha o profissional e o horário livre na agenda da clínica.
            </p>

            <ol className="mt-8 flex flex-col gap-5">
              {[
                { icon: UserIcon, title: "Escolha o profissional", text: "Veja a especialidade de cada dentista." },
                { icon: CalendarIcon, title: "Escolha dia e horário", text: "Só aparecem horários realmente livres." },
                { icon: CheckIcon, title: "Confirme seus dados", text: "Informe nome e WhatsApp e pronto." },
              ].map((step, i) => (
                <li key={step.title} className="flex items-start gap-4">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: palette[i] }}
                  >
                    <step.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">
                      {i + 1}. {step.title}
                    </p>
                    <p className="text-sm text-slate-600">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              href={bookingHref}
              className="mt-8 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white shadow-md"
              style={{ backgroundColor: secondary }}
            >
              Começar agendamento →
            </Link>
          </div>
        </div>
      </section>

      {/* Equipe */}
      {clinic.dentists.length > 0 && (
        <section id="equipe" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-xl text-center">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: secondary }}>
                Profissionais
              </p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Nossa Equipe</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {clinic.dentists.map((dentist) => (
                <div
                  key={dentist.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {dentist.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={dentist.photoUrl}
                      alt={dentist.user.name}
                      className="aspect-[4/5] w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex aspect-[4/5] w-full items-center justify-center text-5xl font-bold text-white"
                      style={{ backgroundColor: secondary }}
                    >
                      {dentist.user.name.replace(/^Dr[a]?\.\s*/, "").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold">{dentist.user.name}</h3>
                    {dentist.specialty && (
                      <p className="text-sm font-medium" style={{ color: secondary }}>
                        {dentist.specialty}
                      </p>
                    )}
                    {dentist.cro && <p className="text-xs text-slate-500">{dentist.cro}</p>}
                    {dentist.publicBio && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{dentist.publicBio}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contato */}
      <section
        id="contato"
        className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20"
        style={{ backgroundColor: `${accent}14` }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: secondary }}>
              Fale com a gente
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Contato e horários</h2>

            <ul className="mt-6 flex flex-col gap-3">
              {clinic.phone && (
                <li className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <PhoneIcon className="h-5 w-5 shrink-0" />
                  <a href={`tel:${clinic.phone.replace(/\D/g, "")}`} className="font-medium">
                    {clinic.phone}
                  </a>
                </li>
              )}
              {clinic.email && (
                <li className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <MailIcon className="h-5 w-5 shrink-0" />
                  <a href={`mailto:${clinic.email}`} className="break-all font-medium">
                    {clinic.email}
                  </a>
                </li>
              )}
              {clinic.address && (
                <li className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0" />
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium"
                  >
                    {clinic.address}
                  </a>
                </li>
              )}
            </ul>

            {sortedHours.length > 0 && (
              <div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
                <p className="mb-2 flex items-center gap-2 font-semibold">
                  <ClockIcon className="h-5 w-5" /> Horário de atendimento
                </p>
                <ul className="text-sm text-slate-600">
                  {sortedHours.map((wh) => (
                    <li key={wh.dayOfWeek} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
                      <span>{DAY_LABELS[wh.dayOfWeek]}</span>
                      <span className="font-medium text-slate-800">
                        {wh.startTime} – {wh.endTime}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg sm:p-8">
            <h3 className="mb-1 text-xl font-bold">Envie uma mensagem</h3>
            <p className="mb-5 text-sm text-slate-600">
              Dúvidas sobre tratamentos ou valores? Respondemos pelo contato que você informar.
            </p>
            <ContactForm clinicId={clinic.id} primary={primary} />
          </div>
        </div>
      </section>

      <SiteFooter clinic={clinic} primary={primary} />
    </div>
  );
}
