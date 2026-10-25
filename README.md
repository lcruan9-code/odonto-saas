# Odonto SaaS

Plataforma SaaS para clínicas de odontologia: agendamento online, gestão de
pacientes, horários de funcionamento por dia da semana e contatos.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS
- Zod (validação)
- NextAuth (autenticação, a configurar)

## Modelo de dados (`prisma/schema.prisma`)

- `Clinic` — tenant (multi-clínica)
- `User` / `Dentist` — usuários e dentistas por clínica
- `Patient` / `Contact` — pacientes e seus contatos (telefone, WhatsApp, e-mail)
- `WorkingHour` — horário de funcionamento por dia da semana
- `Appointment` — agendamentos, com checagem de conflito por dentista

## Repositórios open-source usados como referência

| Repo | Stack | Pontos relevantes |
|---|---|---|
| [Fouzia-Oreen/DentalWell](https://github.com/Fouzia-Oreen/DentalWell_DentalClinic-Appointment-Management-SaaS) | Next.js, Prisma, PostgreSQL, Tailwind | CRM de pacientes, agendamento, billing — stack base deste projeto |
| [emagarin074/Dently](https://github.com/emagarin074/Dently) | Python, multi-tenant | Odontograma, procedure builder, billing |
| [AbdelazizKazoum/DentiFlow](https://github.com/AbdelazizKazoum/DentiFlow) | NestJS + Next.js | Arquitetura multi-tenant orientada a eventos |
| [ViolettaNcl/DentalClinic](https://github.com/ViolettaNcl/DentalClinic) | ASP.NET Core | Clean architecture para gestão de pacientes/agendamentos |
| [Thrust-Devs-Ltd/Dental-Medical-Managment-System](https://github.com/Thrust-Devs-Ltd/Dental-Medical-Managment-System) | Laravel/PHP | Odontograma, alertas por SMS, faturamento |

## Setup

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

## Estrutura

```
src/
  app/
    page.tsx                  # landing
    dashboard/
      agenda/                 # agendamentos
      pacientes/              # gestão de pacientes
      horarios/               # horários por dia da semana
    api/
      patients/route.ts
      appointments/route.ts
      working-hours/route.ts
  lib/
    prisma.ts
    validation.ts
prisma/
  schema.prisma
  seed.ts
```

## Próximos passos

- Autenticação multi-tenant (NextAuth + middleware por `clinicId`)
- Agendamento público (página externa de booking para pacientes)
- Notificações (e-mail/WhatsApp) de confirmação e lembrete
- Odontograma e prontuário clínico
