import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publicClinicSelect } from "@/lib/public-clinic";
import { ClinicHome } from "@/components/clinic-home";

const getPublicClinic = cache(async (slug: string) => {
  return prisma.clinic.findUnique({ where: { slug }, select: publicClinicSelect });
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

  return <ClinicHome clinic={clinic} unpublishedNotice={isPreview} />;
}
