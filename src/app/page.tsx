export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold">Odonto SaaS</h1>
      <p className="text-slate-600">
        Plataforma de gestão para clínicas odontológicas: agendamento online,
        gestão de pacientes, horários de funcionamento por dia da semana e contatos.
      </p>
      <div className="flex gap-3">
        <a
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-white hover:opacity-90"
        >
          Entrar
        </a>
        <a
          href="/agendar/clinica-exemplo"
          className="rounded-md border border-primary px-4 py-2 text-primary hover:bg-sky-50"
        >
          Agendar consulta (demo)
        </a>
      </div>
    </main>
  );
}
