# Odonto SaaS

Sistema completo para clínicas odontológicas: site da clínica com agendamento
online e painel administrativo para a equipe (agenda visual, profissionais,
pacientes e configurações). Pensado como **white-label**: você troca nome,
cores e logo em um único arquivo e entrega o produto com a sua marca.

## O que vem pronto

**Site público da clínica** (`/clinica/<slug>`)
- Home com serviços, equipe, sobre, contato e formulário de mensagem.
- Agendamento online (`/agendar/<slug>`) que mostra só horários realmente livres.

**Painel da clínica** (`/dashboard`, com login)
- **Início**: indicadores do dia, próximas consultas, consultas por status.
- **Agenda**: calendário (dia, semana, mês) com cores por profissional; clique
  num horário para agendar ou bloquear; arraste para remarcar; visão em lista.
- **Profissionais**: cadastro com login próprio, cor na agenda, foto, mini-bio
  e grade semanal de atendimento com intervalo.
- **Pacientes**: tabela com busca, filtros, ordenação e paginação; botão de
  WhatsApp; painel com dados, contatos e histórico de consultas.
- **Administração**: dados da clínica, identidade visual, serviços, mensagens
  do site, horário de funcionamento e publicação do site, com **prévia ao vivo**
  do site ao lado (computador ou celular) que mostra as alterações antes de salvar.
- **Imagens por upload**: logo, capa, foto do consultório e fotos dos
  profissionais são enviadas do computador (arrastar e soltar ou escolher arquivo).

**Perfis de acesso**: Administrador, Recepção e Dentista (o dentista vê a agenda
e bloqueia apenas a própria agenda).

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- PostgreSQL + Prisma
- NextAuth (login por e-mail e senha, sessão JWT)
- Tailwind CSS + shadcn/ui (Radix) + lucide-react
- FullCalendar (agenda) e TanStack Table (pacientes)
- Zod (validação)

## Rodando localmente

Requisitos: Node.js 18.18+ (recomendado 20) e Docker (ou qualquer PostgreSQL 14+).

```bash
cp .env.example .env      # ajuste se não for usar o banco do Docker
npm install
npm run db:up             # sobe o PostgreSQL local (docker-compose.yml)
npm run db:setup          # cria as tabelas e carrega a clínica de demonstração
npm run dev               # http://localhost:3000
```

Logins da demonstração (clínica fictícia **Sorriso Pleno Odontologia**):

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@sorrisopleno.com.br` | `admin123` |
| Recepção | `recepcao@sorrisopleno.com.br` | `recepcao123` |
| Dentista | `ana.souza@sorrisopleno.com.br` | `dentista123` |

Site da clínica: `http://localhost:3000/clinica/sorriso-pleno`

### Banco de dados

- **Variáveis** (`.env`):
  - `DATABASE_URL`: conexão usada pela aplicação.
  - `DIRECT_URL`: conexão direta usada pelas migrations. Localmente é igual à
    `DATABASE_URL`; em provedores com pool (Supabase, Neon), use a URL do pool
    na `DATABASE_URL` e a conexão direta na `DIRECT_URL`.
- **Migrations** ficam em `prisma/migrations` e são aplicadas com
  `npm run db:migrate` (o `npm run build` também aplica, o que facilita o deploy).
- **Alterar o modelo**: edite `prisma/schema.prisma` e rode
  `npx prisma migrate dev --name descricao-da-mudanca` para gerar a migration.
- **Dados de demonstração**: `npm run db:seed`. O seed é idempotente (pode rodar
  de novo sem duplicar). Em produção ele também pode ser disparado por
  `GET /api/seed?key=<SEED_SECRET>`; sem `SEED_SECRET` definido, a rota fica desligada.
- **Ver/editar dados**: `npm run prisma:studio`.

## Personalizando a marca (white-label)

Tudo fica em **`src/config/white-label.ts`**:

| Campo | O que muda |
|---|---|
| `productName`, `productTagline`, `productDescription` | Nome e textos do produto (aba do navegador, login, página inicial, rodapé do painel) |
| `logoUrl` | Logo do produto. `null` usa o ícone padrão. Aceita URL ou arquivo em `/public` (ex.: `"/images/logo.svg"`) |
| `colors.primary` / `secondary` / `accent` | Paleta do sistema inteiro: o Tailwind gera as variáveis de cor a partir daqui |
| `dentistColors` | Paleta sugerida para diferenciar profissionais na agenda |
| `contact` | E-mail, telefone e WhatsApp comercial na página inicial (vazio = oculto) |
| `defaults` | Texto padrão do botão de agendamento e duração padrão da consulta |
| `demo` | Clínica de demonstração em destaque e quadro de credenciais no login |

Depois de alterar, reinicie o `npm run dev` (as cores são lidas no build do CSS).

**Antes de entregar a um cliente**, em `src/config/white-label.ts`:
- `demo.showCredentialsOnLogin: false` para esconder o quadro de credenciais;
- `demo.clinicSlug: null` para remover os atalhos da demonstração.

Também troque as senhas da demonstração ou crie a clínica real direto no banco.

Cada clínica pode ainda ter **identidade própria** (logo, cores, imagens e textos
do site) em *Administração > Identidade visual*. O que a clínica salva no banco
tem prioridade sobre o padrão do arquivo de configuração.

## Imagens enviadas (upload)

- O navegador redimensiona e comprime a imagem antes de enviar (WebP, até
  1600 px no maior lado; logo até 512 px): uma foto de celular de 8 MB vira
  poucas centenas de KB.
- `POST /api/uploads` (só Administrador) confere o tipo real do arquivo
  (JPG, PNG ou WebP; SVG é recusado) e o limite de 3 MB.
- As imagens ficam na tabela `Asset` do próprio PostgreSQL e são servidas por
  `GET /api/assets/<id>` com cache longo (navegador e CDN). Assim o sistema
  funciona em qualquer hospedagem, sem contratar armazenamento de arquivos.
- Ao trocar ou remover uma imagem e salvar, a anterior é apagada do banco.
- Para muitas clínicas ou imagens, dá para trocar por S3, Cloudflare R2 ou
  Vercel Blob mudando só `src/app/api/uploads/route.ts` (que devolve a URL
  final da imagem); o resto do sistema só guarda essa URL.

## Como a agenda decide os horários livres

O agendamento online (`/api/public/availability`) cruza, para o dia escolhido:

1. **Horário de funcionamento da clínica** (*Administração > Horários*): limite
   externo; dia fechado não tem horários.
2. **Grade do profissional** (*Profissionais > Horários*): dias, expediente e
   intervalo. Profissional sem grade cadastrada segue o horário da clínica.
3. **Bloqueios** criados na agenda do painel: de um profissional ou da clínica inteira.
4. **Consultas já marcadas** (exceto canceladas).

A criação do agendamento (`/api/public/appointments`) revalida tudo isso dentro
de uma transação serializável, então dois pacientes não conseguem pegar o mesmo
horário. Na agenda interna, a equipe pode encaixar consultas fora da grade, mas
nunca sobre um bloqueio ou outra consulta do mesmo profissional.

Fuso: todos os horários são tratados no horário de Brasília (UTC-3), independente
do fuso do servidor ou do navegador (`src/lib/dates.ts`).

## Deploy (Vercel + PostgreSQL gerenciado)

1. Crie um banco PostgreSQL (Supabase, Neon, Railway, RDS...).
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente:
   - `DATABASE_URL` e `DIRECT_URL` (veja *Banco de dados*);
   - `NEXTAUTH_SECRET`: string aleatória longa (`openssl rand -base64 32`);
   - `NEXTAUTH_URL`: URL pública do sistema (ex.: `https://agenda.suaclinica.com.br`);
   - `SEED_SECRET` (opcional): libera `/api/seed` para carregar a demonstração.
4. Faça o deploy. O build aplica as migrations automaticamente.

O arquivo `vercel.json` fixa a região `gru1` (São Paulo); ajuste se o banco
estiver em outra região, para reduzir a latência.

## Estrutura do projeto

```
src/
  config/white-label.ts     # marca, cores e textos do produto
  app/
    page.tsx                # página inicial do produto
    login/                  # login
    clinica/[slug]/         # site público da clínica
    agendar/[slug]/         # agendamento online
    dashboard/              # painel (agenda, dentistas, pacientes, administracao...)
    api/                    # rotas internas (sessão) e públicas (api/public/*)
  components/
    ui/                     # componentes shadcn/ui
    dashboard/              # menu lateral e barra superior do painel
  lib/
    assets.ts               # validação e limpeza das imagens enviadas
    image-compress.ts       # redimensiona/comprime imagem no navegador
    public-clinic.ts        # dados públicos da clínica (site e prévia)
    availability.ts         # horários livres, grade e bloqueios
    dates.ts                # horário de Brasília
    validation.ts           # schemas Zod
    demo-seed.ts            # clínica de demonstração
    notifications.ts        # ponto de integração para e-mail/WhatsApp
prisma/
  schema.prisma             # modelo de dados
  migrations/               # histórico de migrations
docker-compose.yml          # PostgreSQL local
```

### Modelo de dados (resumo)

- `Clinic`: a clínica (multi-clínica por `clinicId`), com identidade visual e duração da consulta.
- `User`: acesso ao painel (`ADMIN`, `RECEPTIONIST`, `DENTIST`).
- `Dentist`, `DentistSchedule`: profissional e sua grade semanal.
- `WorkingHour`: funcionamento da clínica por dia da semana.
- `TimeBlock`: bloqueios de agenda (profissional ou clínica inteira).
- `Patient`, `Contact`: pacientes e contatos (WhatsApp, telefone, e-mail).
- `Service`: serviços exibidos no site e vinculáveis à consulta.
- `Appointment`: consultas, com status e serviço.
- `ContactMessage`: mensagens do formulário do site.
- `Asset`: imagens enviadas pelo painel.

## Segurança

- Toda rota interna obtém o `clinicId` da sessão, nunca do navegador: uma clínica
  não acessa dados de outra.
- `src/middleware.ts` protege `/dashboard/*`; alterações de cadastro e configuração
  exigem perfil Administrador.
- Senhas com bcrypt; usuários desativados não conseguem entrar.

## Integrações (ponto de extensão)

`src/lib/notifications.ts` é chamado a cada agendamento criado ou remarcado.
Hoje só registra em log; é o lugar para plugar e-mail (Resend, SES) ou
WhatsApp (Meta Cloud API, Twilio) sem mexer nas telas.

## Imagens da demonstração

As fotos em `public/images/demo/` são do [Unsplash](https://unsplash.com)
(Unsplash License: uso livre, inclusive comercial). As pessoas nas fotos não são
os profissionais fictícios da demonstração. Substitua pelas imagens da clínica real.
