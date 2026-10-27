import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const sortedHours = [...clinic.workingHours].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );

  return (
    <div
      style={
        {
          "--brand-primary": primary,
          "--brand-secondary": secondary,
          "--brand-accent": accent,
        } as React.CSSProperties
      }
      className="min-h-screen bg-white text-slate-900"
    >
      {isPreview && (
        <div className="bg-amber-100 p-2 text-center text-sm text-amber-800">
          Prévia — este site ainda não foi publicado. Só administradores da clínica veem esta
          página.
        </div>
      )}

      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
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
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: primary }}
            >
              {clinic.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-lg font-bold">{clinic.name}</span>
        </div>
        <a
          href={`/agendar/${clinic.slug}`}
          className="rounded-full px-5 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: primary }}
        >
          {ctaText}
        </a>
      </header>

      <section
        className="flex flex-col items-center gap-4 px-6 py-16 text-center text-white"
        style={{
          backgroundImage: clinic.coverImageUrl
            ? `linear-gradient(rgba(10,20,40,0.55), rgba(10,20,40,0.55)), url(${clinic.coverImageUrl})`
            : `linear-gradient(135deg, ${primary}, ${secondary} 60%, ${accent})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">{clinic.name}</h1>
        {clinic.description && (
          <p className="max-w-xl text-base text-white/90">{clinic.description}</p>
        )}
        <a
          href={`/agendar/${clinic.slug}`}
          className="mt-2 rounded-full bg-white px-6 py-3 font-semibold"
          style={{ color: primary }}
        >
          {ctaText}
        </a>
      </section>

      {clinic.services.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">Serviços</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {clinic.services.map((service) => (
              <div key={service.id} className="rounded-2xl border p-5 shadow-sm">
                <h3 className="mb-1 font-semibold" style={{ color: primary }}>
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-slate-600">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {clinic.dentists.length > 0 && (
        <section className="bg-slate-50 px-6 py-12">
          <h2 className="mb-6 text-center text-2xl font-bold">Nossa equipe</h2>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {clinic.dentists.map((dentist) => (
              <div key={dentist.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div
                  aria-hidden
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-white"
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
        </section>
      )}

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold">Contato e horários</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            {clinic.phone && <p className="mb-1">📞 {clinic.phone}</p>}
            {clinic.email && <p className="mb-1">✉️ {clinic.email}</p>}
            {clinic.address && <p>📍 {clinic.address}</p>}
          </div>
          {sortedHours.length > 0 && (
            <ul className="text-sm text-slate-600">
              {sortedHours.map((wh) => (
                <li key={wh.dayOfWeek} className="flex justify-between border-b py-1">
                  <span>{DAY_LABELS[wh.dayOfWeek]}</span>
                  <span>
                    {wh.startTime} – {wh.endTime}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer
        className="px-6 py-6 text-center text-sm text-white"
        style={{ backgroundColor: primary }}
      >
        {clinic.name} {clinic.address ? `· ${clinic.address}` : ""}
      </footer>
    </div>
  );
}
