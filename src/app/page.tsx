import Link from "next/link";
import {
  CalendarIcon,
  LockIcon,
  MailIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/dental-icons";
import { ProductBrand } from "@/components/product-brand";
import { whiteLabel } from "@/config/white-label";

const DEMO_SLUG = whiteLabel.demo.clinicSlug;

const FEATURES = [
  { icon: CalendarIcon, title: "Agenda online", text: "Pacientes marcam sozinhos em horários realmente livres." },
  { icon: UsersIcon, title: "Pacientes e equipe", text: "Cadastro de pacientes, dentistas e recepção por clínica." },
  { icon: MailIcon, title: "Site da clínica", text: "Página pública com serviços, equipe e formulário de contato." },
  { icon: SettingsIcon, title: "Administração", text: "Horários, identidade visual, serviços e indicadores do dia." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <ProductBrand />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <LockIcon className="h-4 w-4" /> Entrar
        </Link>
      </header>

      <section className="bg-gradient-to-br from-navy via-primary to-mint text-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {whiteLabel.productTagline}
            </h1>
            <p className="mt-4 max-w-lg text-white/85 sm:text-lg">
              {whiteLabel.productDescription}
              {DEMO_SLUG && " Veja a demonstração com uma clínica fictícia."}
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/demo/clinica.jpg"
            alt="Consultório odontológico"
            className="aspect-[4/3] w-full rounded-[2rem] object-cover shadow-2xl ring-4 ring-white/20"
          />
        </div>
      </section>

      <section className="mx-auto -mt-10 grid max-w-6xl grid-cols-1 gap-4 px-4 sm:px-6 md:grid-cols-2">
        {DEMO_SLUG && (
          <Link
            href={`/clinica/${DEMO_SLUG}`}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-0.5"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Sou paciente</p>
            <h2 className="mt-1 text-xl font-bold">Agendar uma consulta</h2>
            <p className="mt-2 text-sm text-slate-600">
              Site da clínica de demonstração: serviços, equipe e agendamento online.
            </p>
            <span className="mt-4 inline-block font-semibold text-primary group-hover:underline">
              Ver site da clínica →
            </span>
          </Link>
        )}
        <Link
          href="/login"
          className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-0.5"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-navy">Sou da clínica</p>
          <h2 className="mt-1 text-xl font-bold">Acessar o painel</h2>
          <p className="mt-2 text-sm text-slate-600">
            Agenda do dia, pacientes, dentistas, horários e administração do site.
          </p>
          <span className="mt-4 inline-block font-semibold text-navy group-hover:underline">
            Entrar na área da clínica →
          </span>
        </Link>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-slate-50 p-5">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-white">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        {whiteLabel.productName}
        {DEMO_SLUG && " · clínica e dados de demonstração são fictícios."}
      </footer>
    </main>
  );
}
