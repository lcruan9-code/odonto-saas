# Implementação: Home pública por clínica + Home interna + identidade visual

Documento de acompanhamento desta implementação. Atualizado a cada fase.
Branch: `ccr-438bdc3f-hwaln8`. Repositório: `lcruan9-code/odonto-saas`.

## Status geral

| Fase | Status |
|---|---|
| 0 — Auditoria | Concluída |
| 1 — Schema/migrations | Concluída (migration criada, **não aplicada em produção** — aguarda autorização) |
| 2 — Administração | Concluída |
| 3 — Home pública /clinica/[slug] | Concluída |
| 4 — Home interna /dashboard | Concluída |
| 5 — Segurança e validação | Concluída (ver limitações) |
| 6 — Documentação final | Concluída |

**Nada foi commitado, enviado (push) ou implantado (deploy) nesta sessão.** Todas as
alterações estão no working tree local, aguardando revisão e autorização explícita,
conforme regra obrigatória do prompt desta tarefa.

> As fases acima foram autorizadas e aplicadas em produção em sessão seguinte
> (commit, push, migration no Supabase e deploy na Vercel), incluindo correção
> de um problema real descoberto no processo: o deploy automático da Vercel
> (disparado pelo próprio `git push`, via integração com o GitHub) rodou
> `prisma migrate deploy` contra produção usando o papel `app_user`, que só
> tinha GRANT de DML e não era dono das tabelas — `ALTER TABLE`/`CREATE TABLE`
> exigem ownership. Corrigido transferindo o ownership das 9 tabelas para
> `app_user` (`ALTER TABLE ... OWNER TO app_user`) e resolvendo a migration
> que ficara marcada como falha (`UPDATE "_prisma_migrations" SET
> rolled_back_at = now()` na linha falha, mantendo a linha de sucesso
> registrada manualmente). Isso deixa o projeto mais robusto: deploys futuros
> não precisam mais de aplicação manual de migration via Supabase MCP antes
> do deploy — `prisma migrate deploy` já consegue rodar sozinho no build da
> Vercel.

## Iteração seguinte — identidade visual de referência e formulário de contato

A pedido do usuário, a home pública (`/clinica/[slug]`) foi redesenhada para
seguir o estilo visual de um template de referência fornecido (paleta
azul-marinho/petróleo/menta, cards de serviço com ícone em badge colorido,
header com CTA em pill, hero em gradiente de marca, seção de equipe, contato
com formulário). Como já estabelecido na Fase 3 original, a marca de
referência ("Sorriso Vital") **não foi fixada** — o layout e a paleta
continuam vindo dos campos configuráveis por clínica (`Clinic.primaryColor` /
`secondaryColor` / `accentColor` / `logoUrl` / `coverImageUrl`), com a mesma
paleta de referência como *default* quando a clínica não personaliza. Nenhuma
imagem de terceiro foi usada: quando a clínica não tem logo/capa, o layout usa
um ícone de dente desenhado em SVG inline (`src/components/dental-icons.tsx`)
como placeholder, não uma foto de banco de imagens. A seção de depoimentos do
template de referência **não foi implementada**, por decisão já registrada na
Fase 3 original ("não criar depoimentos fictícios").

Adicionado também um formulário de contato público funcional (estava na
referência visual como "Área de contato"):
- Novo modelo `ContactMessage` (`clinicId`, `name`, `email?`, `phone?`,
  `message`, `createdAt`), migration aditiva
  `prisma/migrations/20261027120000_add_contact_message`.
- `POST /api/public/contact` (rota pública, com campo honeypot anti-bot) e
  `GET /api/contact-messages` / `DELETE /api/contact-messages/[id]`
  (autenticadas, `clinicId` da sessão) para o admin ver e remover mensagens —
  nova seção "Mensagens do site" em `/dashboard/administracao`.

Responsividade mobile: todas as seções usam grid responsivo Tailwind
(`grid-cols-1` por padrão, `sm:`/`md:`/`lg:` para abrir colunas), header com
navegação por âncora escondida abaixo de `md` (fica só logo + botão de
agendar), textos com tamanho escalonado (`text-3xl sm:text-4xl md:text-5xl`).
Não há ferramenta de captura de tela/browser automatizado usada nesta sessão
para evidência visual — validado por `next build` (sem erros) e revisão de
código das classes responsivas, mesma limitação já registrada na Fase 5
original.

Validado: `prisma validate`, `prisma generate`, `tsc --noEmit`, `next build` —
todos sem erro.

## Fase 0 — Auditoria (achados)

- Stack: Next.js 14.2.15 (App Router) + TypeScript + Prisma 5.20 + PostgreSQL + Tailwind + NextAuth v4 (Credentials, JWT).
- `git status`: working tree limpo antes de iniciar, branch `ccr-438bdc3f-hwaln8` sincronizada com `origin`.
- Modelo de dados atual (`prisma/schema.prisma`): `Clinic`, `User`, `Dentist`, `Patient`, `Contact`, `WorkingHour`, `Appointment`. Multi-tenant via `clinicId` em cada tabela.
- Autenticação: `src/lib/auth.ts` (NextAuth Credentials + bcrypt), sessão JWT carrega `clinicId` e `role` (`ADMIN | DENTIST | RECEPTIONIST`). Middleware em `src/middleware.ts` (precisa estar dentro de `src/`, não na raiz — bug já corrigido em commit anterior) protege `/dashboard/*`.
- Padrão de autorização já estabelecido: toda rota autenticada chama `getServerSession(authOptions)` e usa `session.user.clinicId`/`session.user.role` — nunca confia em `clinicId` do body/query. Rotas administrativas (`working-hours` PUT, `dentists` POST, `dentists/[id]` PATCH, `clinic` PATCH) checam `role === "ADMIN"`.
- Navegação do dashboard: `src/app/dashboard/layout.tsx`, lista fixa (`Agenda`, `Pacientes`, `Dentistas`, `Horários`, `Administração`), sem destaque de rota ativa.
- Agendamento público existente: `/agendar/[slug]` (`src/app/agendar/[slug]/page.tsx` + `booking-form.tsx`) consome `GET /api/public/clinics/[slug]`, `GET /api/public/availability`, `POST /api/public/appointments`. Já valida que o dentista pertence à clínica e está `active`.
- Upload/armazenamento: **nenhum configurado** no projeto (sem S3/Supabase Storage/Cloudinary, sem variável de ambiente para isso). Serviço Supabase do projeto hoje é usado só como Postgres (via `DATABASE_URL`/`DIRECT_URL`), não há bucket de Storage criado nem chave de serviço disponível para esta sessão.
- Banco de produção já provisionado (Supabase, projeto `odonto-saas`, `sa-east-1`) e aplicação já publicada na Vercel (`odonto-saas-ruan-paivas-projects.vercel.app`). **Nesta implementação, por instrução explícita do novo prompt, não haverá migration em produção nem novo deploy sem autorização separada** — diferente do fluxo usado nas tarefas anteriores desta mesma conversa.
- Sem servidor Postgres local disponível neste ambiente (`pg_ctl`/`postgres`/`initdb` ausentes) — testes de integração reais (end-to-end contra banco) não são executáveis localmente. Validação possível: `prisma validate`, `prisma generate`, `prisma migrate diff` (sem necessidade de conexão), `tsc --noEmit`, `next build` (com `DATABASE_URL` fictício, já que as páginas são dinâmicas e não tocam o banco em build-time), `next lint`.

## Fase 1 — Schema/migrations

Campos novos em `Clinic` (todos opcionais ou com default seguro — nenhum registro
existente quebra): `description`, `logoUrl`, `coverImageUrl`, `primaryColor`
(default `#0A2B4E`), `secondaryColor` (default `#007A8A`), `accentColor` (default
`#3BBEB8`), `ctaText` (default `"Agende sua Consulta"`), `published` (default
`false` — a home pública nova só fica visível ao público depois que um admin
publica explicitamente; `/agendar/[slug]` continua público independente disso,
sem mudança de comportamento).

Novo modelo `Service` (`clinicId`, `name`, `description?`, `active`, `order`,
timestamps), `@@index([clinicId])`, cascade delete com a clínica — mesmo padrão
das demais tabelas.

Em `Dentist`: `publicVisible` (default `true`, controla exibição na home pública,
independente de `active`, que controla se o dentista pode ser agendado) e
`publicBio` opcional.

Migration: `prisma/migrations/20261027000000_add_public_home_branding/migration.sql`
— gerada com `prisma migrate diff --from-schema-datamodel <schema anterior> --to-schema-datamodel prisma/schema.prisma --script`
(sem precisar de conexão com banco). Só contém `ADD COLUMN` (com default, Postgres
faz backfill automático nas linhas existentes) e `CREATE TABLE "Service"` — aditiva,
sem risco de perda de dado. **Rollback seguro**: como é puramente aditiva, o app
anterior a este continua funcionando normalmente contra o banco já migrado (ele
simplesmente ignora as colunas/tabela novas); não é necessário reverter a
migration para voltar à versão anterior do código.

`npx prisma validate` e `npx prisma generate` executados com sucesso (ver Fase 5).

**Esta migration NÃO foi aplicada ao banco de produção (Supabase) nesta sessão.**
Diferente de sessões anteriores desta mesma conversa (onde eu tinha autorização
corrente para aplicar migrations e fazer deploy), o prompt desta tarefa exige
aprovação explícita e separada antes de qualquer ação em produção. Instruções de
aplicação estão na Fase 6.

## Fase 2 — Administração

Nenhum formulário foi duplicado — a tela `/dashboard/administracao` (que já existia)
ganhou três novas seções abaixo da seção "Dados da clínica" existente (que não foi
alterada):

- **Identidade visual** (`branding-form.tsx`): descrição institucional, URL de logo,
  URL de capa, 3 cores (color picker), texto do CTA. `PATCH /api/clinic` (mesma rota
  já existente, schema estendido).
- **Serviços** (`services-manager.tsx`): criar, ativar/desativar, reordenar
  (troca de `order` entre vizinhos) e remover. Rotas novas `GET/POST /api/services`,
  `PATCH/DELETE /api/services/[id]`.
- **Publicação** (`publish-toggle.tsx`): liga/desliga `Clinic.published` e linka
  para `/clinica/[slug]` (preview).

Tudo protegido por `role === "ADMIN"` no servidor (campos ficam `disabled` na UI
para não-admin, mas a validação real está nas rotas, que já seguem o padrão
"clinicId vem da sessão" do restante do projeto). Validação com Zod
(`clinicBrandingSchema`, `clinicPublishSchema`, `serviceCreateSchema`,
`serviceUpdateSchema` em `src/lib/validation.ts`): cor precisa casar com
`#RRGGBB`, URL de imagem precisa começar com `http(s)://`.

**Upload de imagem**: não implementado como upload de arquivo binário. O projeto
não tem nenhum serviço de storage configurado (sem S3/Supabase
Storage/Cloudinary, sem variável de ambiente, sem chave de serviço disponível
nesta sessão) — inventar credenciais ou declarar um upload "funcional" sem
testá-lo violaria regra explícita do prompt. Em vez disso, logo e capa são
campos de URL validados (precisam ser `http(s)://`). Documentado aqui como
pendência real: para upload de arquivo de fato, a opção mais simples dado o
que já está disponível no projeto é um bucket do Supabase Storage (o projeto já
usa Supabase como Postgres) — requer criar o bucket, gerar uma chave de serviço
e configurar `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (ou equivalente) como
variável de ambiente; isso não foi feito nesta sessão.

Visibilidade pública de dentistas passou a ser editável em
`/dashboard/dentistas` (não em administração, por ficar junto do cadastro do
profissional): toggle "Mostrar no site" (`publicVisible`) e campo de bio pública
(`publicBio`), ambos via `PATCH /api/dentists/[id]` (rota já existente, schema
estendido).

## Fase 3 — Home pública

Nova rota `src/app/clinica/[slug]/page.tsx`, Server Component, busca a clínica
direto via Prisma com `select` explícito (nunca `include` sem select) — só os
campos públicos: nome, slug, descrição, logo/capa, cores, CTA, `published`,
telefone/e-mail/endereço, serviços ativos, dentistas `active && publicVisible`
(apenas nome, especialidade, CRO, bio — sem e-mail, sem `userId`), horários
ativos. `generateMetadata` dinâmico (título/descrição) usando `cache()` do React
para não duplicar a query entre metadata e página na mesma request.

Regras de visibilidade: clínica inexistente → `notFound()`. Clínica existente mas
`published: false` → `notFound()` para o público; se a sessão autenticada for de
um admin **da mesma clínica**, mostra a página com um aviso de prévia no topo
("Prévia — este site ainda não foi publicado").

Seções: header (logo ou inicial do nome + CTA), hero (com cores da clínica ou
fallback para a paleta de referência Sorriso Vital — `#0A2B4E`/`#007A8A`/`#3BBEB8`),
serviços (cards, omitida se não houver nenhum serviço ativo), equipe (cards com
inicial do nome como avatar se não houver foto — não há campo de foto de
dentista neste escopo, por ora usa-se avatar textual), contato/horários, rodapé.
Sem depoimentos nem alegações clínicas fixas (nenhuma seção desse tipo foi
criada, conforme pedido). Sem `next/image`: como a URL do logo/capa é definida
livre pelo administrador da clínica (não dá para pré-configurar domínios
permitidos), optei por `<img>` simples (com `alt` e `eslint-disable` pontual do
`@next/next/no-img-element`) — evita quebrar em runtime por domínio não
whitelisted e evita adicionar configuração nova ao `next.config.js` para um
caso de uso que muda por tenant.

`/agendar/[slug]` **não teve o contrato do `BookingForm` alterado** (mesmas
props: `clinicId`, `dentists: {id, name, specialty}[]`). Só a página ao redor
ganhou logo/cor da clínica no cabeçalho. De quebra, corrigido um bug: a página
listava todos os dentistas da clínica para agendamento, inclusive inativos —
agora filtra `active: true` (a API de disponibilidade já rejeitava dentista
inativo, mas a lista exibida no formulário não deveria nem mostrá-lo).

## Fase 4 — Home interna

Nova página `src/app/dashboard/page.tsx` ("Início", primeiro item do menu,
`/dashboard`). Indicadores, todos filtrados por `clinicId` da sessão e usando
queries agregadas (sem N+1): consultas de hoje (`count` com intervalo de data),
consultas por status (`groupBy`, só os 5 status reais do schema:
`SCHEDULED/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW`), próximas 5 consultas
(`findMany` com include já necessário para exibir nome do paciente/dentista),
total de pacientes (`count`), total de dentistas ativos (`count`). Atalhos para
Agenda, Pacientes, Dentistas, Administração (rotas que já existem).

"Hoje" é calculado em `src/lib/dates.ts` (`getBrazilDayRange`) com offset fixo
UTC-3 (Brasil não observa horário de verão desde 2019), em vez de usar o
horário do servidor (Vercel roda em UTC) — evita que o card "consultas hoje"
conte errado perto da virada do dia.

Login agora redireciona para `/dashboard` (a nova Home) em vez de
`/dashboard/agenda` direto; `/dashboard/agenda` continua existindo e acessível
pelo menu, sem nenhuma mudança de comportamento nela.

## Fase 5 — Segurança e validação

**Isolamento multi-tenant**: todas as rotas novas (`/api/services`,
`/api/services/[id]`) seguem exatamente o padrão já usado no projeto —
`clinicId` vem de `session.user.clinicId`, nunca do body/query; mutations
checam `role === "ADMIN"` quando é admin-only. Revisão manual de cada rota
tocada confirma que nenhuma aceita `clinicId` do cliente como autoridade.

**Dados públicos**: `select` explícito em `/clinica/[slug]` (ver Fase 3) —
auditado campo a campo, nada de paciente/agendamento/e-mail pessoal/ID interno
é renderizado (os `id`s retornados pela query só viram `key` de lista do React,
que nunca é serializado no HTML).

**Condição de corrida no agendamento**: investigada. O fluxo anterior fazia
`findFirst` (checa conflito) e depois `create`/`update` como duas operações
separadas — sob concorrência, duas requisições simultâneas podiam passar pelo
`findFirst` antes de qualquer `create` acontecer e criar dois agendamentos
sobrepostos para o mesmo dentista. Mitigação aplicada nas três rotas que criam
ou reagendam consultas (`POST /api/appointments`, `PATCH /api/appointments/[id]`,
`POST /api/public/appointments`): o par checagem+escrita agora roda dentro de
`prisma.$transaction` com `isolationLevel: Serializable`. Sob esse nível de
isolamento do Postgres, se duas transações concorrentes tentam criar
agendamentos conflitantes, uma delas falha com erro de serialização
(`P2034` no Prisma) em vez de as duas terem sucesso; o código captura esse erro
e devolve 409 pedindo para tentar outro horário (`src/lib/scheduling.ts`).
**Isto reduz a janela de corrida real sem exigir mudança de schema, mas não é
uma garantia absoluta no sentido de constraint de banco** (uma constraint
`EXCLUDE ... USING gist` sobre um range de tempo seria a solução definitiva,
mas exige a extensão `btree_gist` e remodelar `startAt`/`endAt` como um
`tstzrange` — mudança maior, fora do escopo aditivo pedido, não aplicada).
Risco remanescente documentado explicitamente aqui.

**Comandos executados nesta sessão, com resultado real:**

| Comando | Resultado |
|---|---|
| `npx prisma validate` | ✅ `The schema at prisma/schema.prisma is valid` |
| `npx prisma generate` | ✅ Client gerado com os novos tipos (`Service`, campos novos) |
| `npx prisma migrate diff --from-schema-datamodel ... --script` | ✅ gerou o SQL da migration, sem precisar de conexão com banco |
| `npx tsc --noEmit -p tsconfig.json` | ✅ sem erros, rodado 3x ao longo da implementação |
| `npx next build` (com `DATABASE_URL`/`DIRECT_URL` fictícios — build não toca banco real) | ✅ build de produção completo, 20 rotas geradas, incluindo `/clinica/[slug]`, `/dashboard`, `/api/services`, `/api/services/[id]`; `ƒ Middleware` presente (proteção de `/dashboard/*` intacta) |
| `npx next lint` | ⚠️ **Não executado de fato** — o projeto nunca teve ESLint configurado (confirmado: `.eslintrc*` não existe, nem antes nem depois desta sessão); o comando pede para criar a configuração interativamente. Não criei configuração nova por não ser parte do escopo pedido nem algo pré-existente para "preservar". |
| `npm run build` completo (com `prisma migrate deploy` real) | ❌ **Não executado** — exigiria `DATABASE_URL`/`DIRECT_URL` reais, e isso rodaria migration contra o banco de produção, proibido sem autorização explícita nesta tarefa |
| Testes automatizados (`npm test` ou equivalente) | Não existem no projeto (sem script de teste no `package.json`, sem pasta de testes) — nada para rodar |

**O que NÃO foi testado de fato (limitação honesta, sem banco local disponível):**
este ambiente não tem um servidor Postgres local (`pg_ctl`/`postgres`/`initdb`
ausentes) e a única base disponível é a de produção, que esta tarefa proíbe
tocar sem autorização separada. Por isso, os seguintes itens foram validados
por **leitura cuidadosa do código e dos tipos**, não por execução ponta a ponta
contra um banco real:
- tentativa de acessar/alterar dado de outra clínica (a lógica de todas as
  rotas foi revisada linha a linha, mas não houve uma chamada HTTP real de
  teste);
- slug inexistente / clínica despublicada em `/clinica/[slug]` (`notFound()`
  revisado no código, não exercitado em runtime);
- disponibilidade/agendamento respeitando horário e status (já tinha cobertura
  de teste manual real em sessão anterior desta conversa, contra o banco de
  produção, antes das mudanças desta tarefa — as mudanças desta tarefa em si
  não foram reexercitadas contra banco real);
- a mitigação de corrida (`Serializable` + retry 409) não foi testada com
  requisições concorrentes de verdade — é uma medida de código correta e bem
  estabelecida para esse padrão no Postgres, mas "testado honestamente"
  significa reportar que não houve um teste de carga/concorrência real aqui.
- responsividade mobile/tablet/desktop: não há ferramenta de screenshot/browser
  automatizado usada nesta sessão para a página `/clinica/[slug]`; o layout usa
  classes Tailwind responsivas já no mesmo padrão do restante do projeto
  (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`, mesma convenção de
  `src/app/dashboard/administracao/page.tsx` já existente), mas não há
  evidência visual capturada.

## Fase 6 — Resumo final

Ver resposta final enviada ao usuário nesta mesma sessão/conversa.

## Iteração — empresa fictícia completa, fotos, painel no mesmo visual

Pedido do usuário (feedback de teste no celular): CTAs "Agende sua consulta"
repetidos, faltava acesso à área administrativa, sem fotos, e uma empresa
fictícia completa e realista seguindo um fluxo (site de agendamento →
administração). Usuário autorizou commit/push/deploy sem confirmação a partir
daqui.

- **Empresa fictícia** "Sorriso Pleno Odontologia" (`src/lib/demo-seed.ts`,
  idempotente; migra a antiga `clinica-exemplo`, com redirect em
  `next.config.js`). Executada em produção via `/api/seed`: 4 dentistas,
  12 pacientes, 6 serviços, 78 consultas (passado/futuro, todos os status),
  2 mensagens de contato.
- **Fotos**: Unsplash License, servidas de `public/images/demo/` (sem hotlink).
  Novos campos `Dentist.photoUrl` e `Clinic.aboutImageUrl` (migrations
  aditivas `20261028000000_add_dentist_photo`, `20261028010000_add_clinic_about_image`,
  aplicadas automaticamente pelo build da Vercel). Validação de URL aceita
  `http(s)://` ou caminho local `/...` (recusa `//host`, `javascript:`, `data:`).
- **CTAs**: um botão principal no hero; "Agendar" no header só no desktop;
  seção "Como funciona" com rótulo distinto ("Começar agendamento").
- **Área administrativa**: link "Área da clínica"/"Entrar" no header e rodapé
  do site; login redesenhado com credenciais de demonstração visíveis
  (ambiente demo — qualquer pessoa com o link consegue entrar e alterar os
  dados de demonstração).
- **Painel**: menu lateral azul-marinho com item ativo e menu recolhível no
  celular, home com agenda do dia/status/próximos dias, tabelas roláveis no
  celular, abas na agenda (a partir de hoje / anteriores).
- **Bugs corrigidos**:
  - Fuso horário: `/api/public/availability` montava os horários no fuso do
    servidor (UTC na Vercel) — o expediente 08:00 aparecia como 05:00 para o
    paciente. Agora em horário de Brasília (`src/lib/dates.ts`). Datas exibidas
    no painel e notificações também passaram a usar `America/Sao_Paulo`.
  - Disponibilidade não validava se o dentista era da clínica/ativo.
  - `/api/seed` era pré-renderizado estaticamente no build (resposta fixa).
  - Seed fazia ~200 consultas sequenciais e estourava o tempo da função.
- **Performance**: `vercel.json` com `regions: ["gru1"]` — funções em São
  Paulo, junto do banco (sa-east-1). Seed caiu de >60 s (timeout) para 1,3 s.
- **Validado**: `tsc --noEmit` e `next build` limpos; capturas reais com
  Playwright do site em produção (390 px e 1366 px) — home, agendamento,
  login, painel (com login real) e agenda.

## Painel administrativo white-label (7 fases)

Pedido: transformar o painel em boilerplate white-label para venda do código.
Autorizado executar as fases em sequência ("pode seguir todas as fases").

1. **Config white-label**: `src/config/white-label.ts` (nome, logo, paleta,
   cores de profissionais, contato, textos padrão, demo). Tailwind gera as
   variáveis de cor a partir dele; dados da clínica no banco têm prioridade.
2. **Schema**: `Dentist.color`, `DentistSchedule` (grade semanal com intervalo),
   `TimeBlock` (bloqueio de profissional ou clínica inteira),
   `Appointment.serviceId`. Migrations aditivas; seed preenche tudo.
3. **Layout**: shadcn/ui (Radix), menu lateral fixo, Sheet no celular, barra
   superior com menu do usuário; todas as páginas com `requireSession()`.
4. **Agenda** (`/dashboard/agenda`): FullCalendar (dia/semana/mês, dia no
   celular), cores por profissional, filtro (grade do profissional vira o
   horário útil), clique/arraste cria agendamento ou bloqueio, arrastar
   remarca (com reversão em erro), detalhes com status/WhatsApp/remarcar/
   cancelar. Calendário roda em `timeZone: "UTC"` com datas já convertidas
   para Brasília. APIs `api/agenda/events`, `api/time-blocks`.
5. **Profissionais** (`/dashboard/dentistas`): cards com dias de atendimento;
   Sheet com abas Dados/Horários; APIs `POST/PATCH/DELETE api/dentists`,
   `GET/PUT api/dentists/[id]/schedule`. Exclusão só sem histórico.
6. **Pacientes** (`/dashboard/pacientes`): TanStack Table com busca (nome sem
   acento, telefone, e-mail), filtros por status/profissional, ordenação,
   paginação; colunas Nome, WhatsApp (wa.me), Último serviço, Data/Hora,
   Profissional, Status. "Último serviço" = última consulta já realizada (ou a
   próxima, se só houver futuras). Painel lateral com edição e histórico.
   Corrigido: `GET api/patients/[id]` expunha o `passwordHash` do dentista.
7. **Integração com o site público**: `src/lib/availability.ts`
   (`getWorkWindows`, `getFreeSlots`, `isWithinWorkHours`): funcionamento da
   clínica ∩ grade do profissional − intervalo − bloqueios − consultas. O POST
   público revalida expediente e bloqueio dentro da transação. README reescrito
   para o comprador; `docker-compose.yml` e scripts `db:*`.

Validação: `tsc` e `next build` limpos a cada fase; testes Playwright em
produção (criar bloqueio/consulta pelo calendário, 409 em horário bloqueado,
CRUD de profissional com login do novo usuário, 403 para perfil dentista,
busca/filtros/ordenação/paginação de pacientes); fluxo do README executado do
zero num PostgreSQL 16 local (migrations + seed + disponibilidade + rejeições).
