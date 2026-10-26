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
- Rotas internas derivam o `clinicId` da sessão — nunca confiam no valor enviado pelo cliente.
- Cadastro de dentistas, horários e dados da clínica só podem ser alterados por `role: ADMIN`.

## Funcionalidades do dashboard (CRM)

- **Agenda** (`/dashboard/agenda`): lista agendamentos, cria novo agendamento (paciente +
  dentista + horário), reagenda (troca dentista/horário com checagem de conflito) e ajusta
  status (agendado, confirmado, concluído, faltou, cancelado) inline.
- **Pacientes** (`/dashboard/pacientes`): cadastro e edição (nome, contato, observações).
- **Dentistas** (`/dashboard/dentistas`, admin): cadastro (cria usuário de login + perfil),
  ativar/desativar — dentista inativo some do agendamento interno e da página pública.
- **Horários** (`/dashboard/horarios`, admin): edição por dia da semana (início, fim, ativo).
- **Administração** (`/dashboard/administracao`, admin): indicadores (usuários, dentistas,
  pacientes, agendamentos) e dados da clínica (nome, contato, duração padrão da consulta).

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

## Banco de dados (já provisionado)

Projeto Supabase **odonto-saas** (região `sa-east-1`, ref `sbweorsknrbuhfbzctuu`) já criado,
com o schema aplicado e dados de demonstração inseridos (clínica, admin, dentista, horários
de seg-sex). Só falta ligar a Vercel a ele.

## Deploy pela Vercel (pelo navegador, sem terminal)

1. Acesse **vercel.com** → login com GitHub (se Vercel já está conectado pelo GitHub, pule
   para o Dashboard).
2. **Add New → Project** → selecione `lcruan9-code/odonto-saas` → branch `ccr-438bdc3f-hwaln8`.
3. Em **Settings → Environment Variables**, adicione:
   - `DATABASE_URL` — no Supabase, abra o projeto **odonto-saas** → **Project Settings →
     Database → Connection string** → aba **Transaction pooler** (porta `6543`) → copie a URI
     e substitua `[YOUR-PASSWORD]` pela senha do banco (gerada na criação do projeto, visível
     ali mesmo ou redefinível em **Database → Reset password**)
   - `DIRECT_URL` — mesma tela, aba **Session pooler** ou **Direct connection** (porta `5432`),
     mesma senha
   - `NEXTAUTH_SECRET` — qualquer string aleatória
   - `SEED_SECRET` — qualquer string aleatória (já não é necessária para os dados de
     demonstração, mas fica disponível para repopular se precisar)
4. Clique em **Deploy**. O build roda `prisma migrate deploy`; como a migration inicial já foi
   aplicada diretamente no Supabase, ele só confirma que está tudo sincronizado (não recria nada).
5. Depois do primeiro deploy, copie a URL gerada (ex: `https://odonto-saas.vercel.app`):
   - Volte em **Settings → Environment Variables**, adicione `NEXTAUTH_URL` com essa URL
     e clique em **Redeploy**.
6. Testar:
   - Login: `https://SEU-DOMINIO.vercel.app/login` com `admin@clinicaexemplo.com.br` / `admin123`
   - Agendamento público: `https://SEU-DOMINIO.vercel.app/agendar/clinica-exemplo`

## Próximos passos

- Provedor real de e-mail/WhatsApp em `notifications.ts` + lembrete automático (cron/job)
- Odontograma e prontuário clínico
- Telas de CRUD completas no dashboard (criar/editar paciente, horário, agendamento)
- Cadastro de nova clínica (onboarding self-service)
