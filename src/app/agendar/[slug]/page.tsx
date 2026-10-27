import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SiteFooter, SiteHeader } from "@/components/clinic-site";
import { BookingForm } from "./booking-form";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.slug },
    select: { name: true },
  });
  return { title: clinic ? `Agendar consulta — ${clinic.name}` : "Agendar consulta" };
}

export default async function BookingPage({ params }: { params: { slug: string } }) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.slug },
    include: {
      dentists: {
        where: { active: true },
        orderBy: { user: { name: "asc" } },
        include: { user: true },
      },
    },
  });

  if (!clinic) notFound();

  const primary = clinic.primaryColor || "#0A2B4E";
  const secondary = clinic.secondaryColor || "#007A8A";
  const accent = clinic.accentColor || "#3BBEB8";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader clinic={clinic} primary={primary} variant="booking" />

      <section
        className="px-4 pb-24 pt-10 text-white sm:px-6"
        style={{ backgroundImage: `linear-gradient(120deg, ${primary}, ${secondary} 60%, ${accent})` }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/70">
            Agendamento online
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Agende sua consulta</h1>
          <p className="mt-2 text-white/85">
            Escolha o profissional, o dia e um horário livre. Leva menos de um minuto.
          </p>
        </div>
      </section>

      <main className="mx-auto -mt-16 w-full max-w-2xl flex-1 px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-white p-5 shadow-xl sm:p-8">
          {clinic.dentists.length === 0 ? (
            <p className="text-center text-slate-600">
              No momento não há profissionais com agenda aberta. Entre em contato com a clínica.
            </p>
          ) : (
            <BookingForm
              clinicId={clinic.id}
              dentists={clinic.dentists.map((d) => ({
                id: d.id,
                name: d.user.name,
                specialty: d.specialty,
              }))}
              primary={primary}
              photos={Object.fromEntries(clinic.dentists.map((d) => [d.id, d.photoUrl]))}
              homeHref={`/clinica/${clinic.slug}`}
            />
          )}
        </div>
      </main>

      <SiteFooter clinic={clinic} primary={primary} />
    </div>
  );
}
