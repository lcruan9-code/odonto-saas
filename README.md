# Odonto SaaS

Plataforma SaaS para clínicas de odontologia: agendamento online, gestão de
pacientes, horários de funcionamento por dia da semana e contatos.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS
- Zod (validação)
- NextAuth (Credentials + JWT, multi-tenant por `clinicId`)

## Modelo de dados (`prisma/schema.prisma`)

- `Clinic` — tenant (multi-clínica), com `slotDurationMinutes` para o agendamento online
- `User` / `Dentist` — usuários e dentistas por clínica
- `Patient` / `Contact` — pacientes e seus contatos (telefone, WhatsApp, e-mail)
- `WorkingHour` — horário de funcionamento por dia da semana
- `Appointment` — agendamentos, com checagem de conflito por dentista

## Autenticação e isolamento multi-tenant

- Login em `/login` (NextAuth Credentials + bcrypt), sessão JWT com `clinicId` e `role`.
- `middleware.ts` protege todas as rotas `/dashboard/*`.
- Rotas internas (`/api/patients`, `/api/appointments`, `/api/working-hours`) derivam o
  `clinicId` da sessão — nunca confiam no valor enviado pelo cliente.
- `WorkingHour` só pode ser alterado por usuários com `role: ADMIN`.

## Agendamento público

- `GET /agendar/[slug]` — página pública de booking por clínica (sem login).
- `GET /api/public/availability` — calcula horários livres a partir de `WorkingHour`,
  `slotDurationMinutes` e agendamentos já existentes do dentista.
- `POST /api/public/appointments` — cria paciente (se novo, por contato) + agendamento,
  com checagem de conflito.

## Notificações

- `src/lib/notifications.ts` — disparada após cada agendamento (interno e público).
  Hoje registra em log; pronta para plugar um provedor real de e-mail (Resend/SES)
  e WhatsApp (Meta Cloud API/Twilio) sem mudar as chamadas.

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

Login de demonstração (criado pelo seed):

- Admin: `admin@clinicaexemplo.com.br` / `admin123`
- Dentista: `dentista@clinicaexemplo.com.br` / `dentista123`

Agendamento público de demonstração: `/agendar/clinica-exemplo`

## Estrutura

```
src/
  app/
    page.tsx                  # landing
    login/                    # login (NextAuth Credentials)
    agendar/[slug]/           # agendamento público por clínica
    dashboard/
      agenda/                 # agendamentos
      pacientes/              # gestão de pacientes
      horarios/               # horários por dia da semana
    api/
      auth/[...nextauth]/
      patients/route.ts
      appointments/route.ts
      working-hours/route.ts
      public/
        clinics/[slug]/route.ts
        availability/route.ts
        appointments/route.ts
  lib/
    prisma.ts
    auth.ts
    validation.ts
    notifications.ts
prisma/
  schema.prisma
  seed.ts
middleware.ts
```

## Deploy pela Vercel (pelo navegador, sem terminal)

1. Acesse **vercel.com** pelo celular → login com GitHub.
2. **Add New → Project** → selecione `lcruan9-code/odonto-saas` → branch `ccr-438bdc3f-hwaln8`.
3. Antes de clicar em Deploy, vá em **Storage → Create Database → Postgres** e conecte ao
   projeto — isso já injeta a variável `DATABASE_URL` automaticamente.
4. Em **Settings → Environment Variables**, adicione:
   - `NEXTAUTH_SECRET` — qualquer string aleatória
   - `SEED_SECRET` — qualquer string aleatória (guarde-a, você vai usar na URL do passo 6)
5. Clique em **Deploy**. O build já roda `prisma migrate deploy` automaticamente
   (configurado em `package.json`), então o banco fica com as tabelas criadas.
6. Depois do primeiro deploy, copie a URL gerada (ex: `https://odonto-saas.vercel.app`):
   - Volte em **Settings → Environment Variables**, adicione `NEXTAUTH_URL` com essa URL
     e clique em **Redeploy**.
   - Pelo próprio navegador, acesse `https://SEU-DOMINIO.vercel.app/api/seed?key=SEU_SEED_SECRET`
     uma vez para criar a clínica de demonstração, o admin e o dentista.
7. Testar:
   - Login: `https://SEU-DOMINIO.vercel.app/login` com `admin@clinicaexemplo.com.br` / `admin123`
   - Agendamento público: `https://SEU-DOMINIO.vercel.app/agendar/clinica-exemplo`

## Próximos passos

- Provedor real de e-mail/WhatsApp em `notifications.ts` + lembrete automático (cron/job)
- Odontograma e prontuário clínico
- Telas de CRUD completas no dashboard (criar/editar paciente, horário, agendamento)
- Cadastro de nova clínica (onboarding self-service)
