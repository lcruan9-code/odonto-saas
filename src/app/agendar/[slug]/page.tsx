import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "./booking-form";

export default async function BookingPage({ params }: { params: { slug: string } }) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.slug },
    include: { dentists: { include: { user: true } } },
  });

  if (!clinic) notFound();

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-1 text-2xl font-bold">{clinic.name}</h1>
      <p className="mb-6 text-slate-600">Agende sua consulta online</p>
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
