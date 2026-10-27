import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ToothIcon, SERVICE_ICONS } from "@/components/dental-icons";
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
const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

// Dados estritamente públicos: nenhum paciente, agendamento, e-mail pessoal
// ou id interno é selecionado aqui.
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
        select: {
          id: true,
          specialty: true,
          cro: true,
          publicBio: true,
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

  const sortedHours = [...clinic.workingHours].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {isPreview && (
        <div className="bg-amber-100 p-2 text-center text-sm text-amber-800">
          Prévia — este site ainda não foi publicado. Só administradores da clínica veem esta
          página.
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
        <div className="flex items-center gap-2">
          {clinic.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={clinic.logoUrl}
              alt={`Logo ${clinic.name}`}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: primary }}
            >
              <ToothIcon className="h-6 w-6" />
            </div>
          )}
          <span className="text-lg font-bold tracking-tight">{clinic.name}</span>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          {clinic.services.length > 0 && <a href="#servicos">Serviços</a>}
          {clinic.dentists.length > 0 && <a href="#equipe">Equipe</a>}
          <a href="#contato">Contato</a>
        </nav>

        <a
          href={`/agendar/${clinic.slug}`}
          className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white sm:px-5 sm:py-2.5"
          style={{ backgroundColor: primary }}
        >
          {ctaText}
        </a>
      </header>

      {/* Hero */}
      <section
        className="px-4 py-14 sm:px-8 sm:py-20"
        style={{
          backgroundImage: `linear-gradient(120deg, ${primary}, ${secondary} 65%, ${accent})`,
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="text-white">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/70">
              Odontologia
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {clinic.name}
            </h1>
            {clinic.description && (
              <p className="mt-4 max-w-md text-base text-white/90 sm:text-lg">
                {clinic.description}
              </p>
            )}
            <a
              href={`/agendar/${clinic.slug}`}
              className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold shadow-lg"
              style={{ color: primary }}
            >
              {ctaText}
            </a>
          </div>

          <div className="flex justify-center md:justify-end">
            {clinic.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={clinic.coverImageUrl}
                alt={`Clínica ${clinic.name}`}
                className="aspect-[4/3] w-full max-w-md rounded-3xl object-cover shadow-2xl"
              />
            ) : (
              <div className="flex aspect-[4/3] w-full max-w-md items-center justify-center rounded-3xl bg-white/10 shadow-2xl ring-1 ring-white/20">
                <ToothIcon className="h-24 w-24 text-white/80" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Serviços */}
      {clinic.services.length > 0 && (
        <section id="servicos" className="px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Nossos Serviços</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.services.map((service, i) => {
                const Icon = SERVICE_ICONS[i % SERVICE_ICONS.length];
                const color = palette[i % palette.length];
                return (
                  <div
                    key={service.id}
                    className="rounded-2xl border p-6 shadow-sm transition hover:shadow-md"
                  >
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-1 font-semibold">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-slate-600">{service.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Equipe */}
      {clinic.dentists.length > 0 && (
        <section id="equipe" className="bg-slate-50 px-4 py-16 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-10 text-center text-2xl font-bold sm:text-3xl">Nossa Equipe</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {clinic.dentists.map((dentist) => (
                <div key={dentist.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div
                    aria-hidden
                    className="mb-3 flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: secondary }}
                  >
                    {dentist.user.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold">{dentist.user.name}</h3>
                  {(dentist.specialty || dentist.cro) && (
                    <p className="text-sm text-slate-500">
                      {[dentist.specialty, dentist.cro].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {dentist.publicBio && (
                    <p className="mt-2 text-sm text-slate-600">{dentist.publicBio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contato */}
      <section id="contato" className="px-4 py-16 sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 md:grid-cols-2">
          <div>
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Contato e horários</h2>
            <div className="mb-6 flex flex-col gap-1 text-slate-700">
              {clinic.phone && <p>📞 {clinic.phone}</p>}
              {clinic.email && <p>✉️ {clinic.email}</p>}
              {clinic.address && <p>📍 {clinic.address}</p>}
            </div>
            {sortedHours.length > 0 && (
              <ul className="text-sm text-slate-600">
                {sortedHours.map((wh) => (
                  <li key={wh.dayOfWeek} className="flex justify-between border-b py-1.5">
                    <span>{DAY_LABELS[wh.dayOfWeek]}</span>
                    <span>
                      {wh.startTime} – {wh.endTime}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border bg-slate-50 p-6">
            <ContactForm clinicId={clinic.id} primary={primary} />
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-sm text-white sm:px-8" style={{ backgroundColor: primary }}>
        <p className="font-semibold">{clinic.name}</p>
        {clinic.address && <p className="text-white/80">{clinic.address}</p>}
      </footer>
    </div>
  );
}
