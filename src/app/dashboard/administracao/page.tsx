import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClinicSettingsForm } from "./clinic-settings-form";
import { BrandingForm } from "./branding-form";
import { ServicesManager } from "./services-manager";
import { PublishToggle } from "./publish-toggle";
import { ContactMessagesList } from "./contact-messages-list";

export default async function AdministracaoPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session!.user.role === "ADMIN";

  const [clinic, userCount, dentistCount, patientCount, appointmentCount, services, messages] =
    await Promise.all([
      prisma.clinic.findUnique({ where: { id: session!.user.clinicId } }),
      prisma.user.count({ where: { clinicId: session!.user.clinicId } }),
      prisma.dentist.count({ where: { clinicId: session!.user.clinicId, active: true } }),
      prisma.patient.count({ where: { clinicId: session!.user.clinicId } }),
      prisma.appointment.count({ where: { clinicId: session!.user.clinicId } }),
      prisma.service.findMany({
        where: { clinicId: session!.user.clinicId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.contactMessage.findMany({
        where: { clinicId: session!.user.clinicId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  if (!clinic) return null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Administração</h1>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Usuários", value: userCount },
          { label: "Dentistas ativos", value: dentistCount },
          { label: "Pacientes", value: patientCount },
          { label: "Agendamentos", value: appointmentCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-md border bg-white p-4">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-medium">Dados da clínica</h2>
      {!isAdmin && (
        <p className="mb-2 text-sm text-slate-500">
          Apenas administradores podem editar os dados da clínica.
        </p>
      )}
      <ClinicSettingsForm
        clinic={{
          name: clinic.name,
          phone: clinic.phone,
          email: clinic.email,
          address: clinic.address,
          slotDurationMinutes: clinic.slotDurationMinutes,
        }}
        canEdit={isAdmin}
      />

      <h2 className="mb-2 mt-8 text-lg font-medium">Identidade visual (home pública)</h2>
      <BrandingForm
        branding={{
          description: clinic.description,
          logoUrl: clinic.logoUrl,
          coverImageUrl: clinic.coverImageUrl,
          aboutImageUrl: clinic.aboutImageUrl,
          primaryColor: clinic.primaryColor,
          secondaryColor: clinic.secondaryColor,
          accentColor: clinic.accentColor,
          ctaText: clinic.ctaText,
        }}
        canEdit={isAdmin}
      />

      <h2 className="mb-2 mt-8 text-lg font-medium">Serviços</h2>
      <ServicesManager
        services={services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          active: s.active,
          order: s.order,
        }))}
        canEdit={isAdmin}
      />

      <h2 className="mb-2 mt-8 text-lg font-medium">Publicação</h2>
      <PublishToggle slug={clinic.slug} initialPublished={clinic.published} canEdit={isAdmin} />

      <h2 className="mb-2 mt-8 text-lg font-medium">Mensagens do site (formulário de contato)</h2>
      <ContactMessagesList
        messages={messages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          message: m.message,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
