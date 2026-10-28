import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ClinicSettingsForm } from "./clinic-settings-form";
import { BrandingForm } from "./branding-form";
import { ServicesManager } from "./services-manager";
import { PublishToggle } from "./publish-toggle";
import { ContactMessagesList } from "./contact-messages-list";
import { PreviewProvider } from "./preview-context";
import { SitePreview } from "./site-preview";

// Muda sempre que algo salvo afeta o site, para a prévia recarregar do banco.
function revisionOf(parts: unknown[]) {
  const text = JSON.stringify(parts);
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = (hash * 33) ^ text.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

export default async function AdministracaoPage() {
  const session = await requireSession();
  const isAdmin = session.user.role === "ADMIN";

  const [clinic, userCount, dentistCount, patientCount, appointmentCount, services, messages] =
    await Promise.all([
      prisma.clinic.findUnique({ where: { id: session.user.clinicId } }),
      prisma.user.count({ where: { clinicId: session.user.clinicId } }),
      prisma.dentist.count({ where: { clinicId: session.user.clinicId, active: true } }),
      prisma.patient.count({ where: { clinicId: session.user.clinicId } }),
      prisma.appointment.count({ where: { clinicId: session.user.clinicId } }),
      prisma.service.findMany({
        where: { clinicId: session.user.clinicId },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.contactMessage.findMany({
        where: { clinicId: session.user.clinicId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

  if (!clinic) return null;

  const revision = revisionOf([
    clinic.updatedAt.getTime(),
    services.map((s) => [s.id, s.name, s.description, s.active, s.order]),
  ]);

  return (
    <PreviewProvider>
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

      <div className="grid gap-8 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        <div className="min-w-0 max-w-lg">
          <Link
            href="/dashboard/horarios"
            className="mb-8 flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent"
          >
            <span className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <span>
                <span className="block font-medium">Horário de funcionamento da clínica</span>
                <span className="block text-sm text-muted-foreground">
                  Dias e horários em que a clínica abre para agendamentos
                </span>
              </span>
            </span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>

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

          <h2 className="mb-2 mt-8 text-lg font-medium">
            Mensagens do site (formulário de contato)
          </h2>
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

        <aside aria-label="Prévia do site" className="min-w-0">
          <SitePreview revision={revision} siteUrl={`/clinica/${clinic.slug}`} />
        </aside>
      </div>
    </PreviewProvider>
  );
}
