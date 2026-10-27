import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "./booking-form";

export default async function BookingPage({ params }: { params: { slug: string } }) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.slug },
    include: { dentists: { where: { active: true }, include: { user: true } } },
  });

  if (!clinic) notFound();

  const primary = clinic.primaryColor || "#0A2B4E";

  return (
    <main className="mx-auto max-w-xl p-8">
      <div className="mb-6 flex items-center gap-3">
        {clinic.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clinic.logoUrl}
            alt={`Logo ${clinic.name}`}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ backgroundColor: primary }}
          >
            {clinic.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{clinic.name}</h1>
          <p className="text-slate-600">Agende sua consulta online</p>
        </div>
      </div>
      <BookingForm
        clinicId={clinic.id}
        dentists={clinic.dentists.map((d) => ({
          id: d.id,
          name: d.user.name,
          specialty: d.specialty,
        }))}
      />
    </main>
  );
}
