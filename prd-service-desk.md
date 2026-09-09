# PRD — Service Desk Interno (Central de Suporte Multi-Aplicação)

**Versão:** 1.0
**Stack alvo:** React + TypeScript + Vite + Tailwind CSS (monolito, sem backend próprio) + Supabase (Auth, Postgres, RLS)
**Público deste documento:** Agente de IA (Gemini, via Antigravity) responsável por gerar a primeira versão do sistema a partir deste PRD + MCP do Supabase.

---

## 1. Visão Geral

A empresa mantém múltiplas soluções de software para clientes distintos (hoje 2, com expectativa de crescer). Cada solução tem seus próprios usuários finais, que precisam de um canal para reportar bugs e solicitar melhorias. Hoje esse processo é informal e disperso.

O objetivo é construir um **Service Desk interno**, nos moldes de um ServiceNow simplificado: um ponto único de entrada de solicitações de suporte para todas as aplicações da empresa, com fila de triagem, priorização, classificação, atribuição de responsável, e um quadro Kanban pessoal por colaborador para organização própria do trabalho (sem impacto no SLA ou no ticket oficial).

## 2. Objetivos

- Permitir que usuários finais de qualquer aplicação da empresa abram uma solicitação de suporte **sem necessidade de login/cadastro**.
- Centralizar todas as solicitações (de todas as aplicações/clientes) em uma única fila.
- Permitir que a equipe interna (colaboradores autenticados) faça a triagem: definir prioridade, classificar como melhoria ou correção de erro, e atribuir um responsável.
- Fornecer um painel de gestão com filtros (por aplicação, status, prioridade, responsável).
- Fornecer um Kanban pessoal por colaborador, para controle próprio de tarefas, podendo referenciar um ticket da fila sem alterar seu status/SLA.
- Ser extensível: novas aplicações/clientes devem poder ser cadastradas sem alteração de schema.

## 3. Escopo

### 3.1 Dentro do escopo (v1)

- Formulário público de abertura de chamado (sem login).
- Fila de triagem e gestão de chamados (autenticado).
- Cadastro de aplicações (as soluções da empresa).
- Cadastro/gestão de colaboradores (usuários internos) e papéis (admin / agente).
- Kanban pessoal por colaborador, com tarefas que podem referenciar um ticket.
- Histórico de mudança de status do ticket (auditoria simples).
- Comentários internos no ticket (uso da equipe, não visível ao solicitante).

### 3.2 Fora do escopo (v1 — considerar para versões futuras)

- Login/autenticação do usuário final (cliente) e acompanhamento de status por ele.
- Anexos/upload de arquivos e imagens no ticket.
- Notificações por e-mail (abertura, mudança de status, SLA estourando).
- SLA automatizado com cálculo de prazos e alertas.
- Respostas públicas visíveis ao solicitante (thread de atendimento bidirecional).
- Multi-idioma.
- App mobile.

## 4. Personas

1. **Usuário final (solicitante)** — usuário de uma das aplicações-cliente. Não tem login. Só quer relatar um problema ou pedir uma melhoria rapidamente.
2. **Agente** — colaborador da empresa que faz a triagem, atende e resolve tickets, e organiza seu próprio trabalho no Kanban.
3. **Admin** — colaborador com permissões adicionais: cadastra aplicações, gerencia outros colaboradores e seus papéis.

## 5. Fluxos Principais

### 5.1 Abertura de chamado (usuário final, sem login)

1. Usuário acessa a página pública de abertura de chamado.
2. Seleciona a **aplicação** (dropdown, ex: "docpm ERP", "AltoMaster Locação").
3. Informa **nome** e **descrição do problema/solicitação**.
4. Envia o formulário.
5. Sistema grava o ticket com status `novo`, sem prioridade/tipo/responsável definidos (esses campos ficam nulos até a triagem).
6. Sistema exibe um **número de protocolo** de confirmação (ex: `SD-2026-00042`).

### 5.2 Triagem (agente/admin, autenticado)

1. Agente faz login e acessa a **Fila de Solicitações**.
2. Tickets com status `novo` aparecem em destaque para triagem.
3. Agente abre o ticket e define: **prioridade** (baixa/média/alta/crítica), **tipo** (melhoria/correção de erro) e **responsável**.
4. Ao salvar a triagem, o status muda automaticamente para `triagem` (ou o agente pode já mover para `em_andamento`).
5. Toda mudança de status é registrada em histórico.

### 5.3 Gestão contínua do ticket

- Agente pode alterar status (`em_andamento`, `aguardando_cliente`, `resolvido`, `fechado`), reatribuir responsável, adicionar comentários internos.
- Painel permite filtrar por aplicação, status, prioridade e responsável.

### 5.4 Kanban pessoal do colaborador

1. Cada colaborador tem seu próprio quadro Kanban, privado (não visível a outros colaboradores).
2. Colaborador cria colunas (ex: "A Fazer", "Fazendo", "Feito") e cria cartões/tarefas dentro delas.
3. Uma tarefa do Kanban **pode opcionalmente referenciar um ticket** da fila (campo de vínculo), apenas para contexto — isso **não altera o status, SLA ou dados do ticket oficial**.
4. O Kanban é uma ferramenta de organização pessoal, totalmente separada do fluxo oficial de atendimento.

## 6. Requisitos Funcionais

| ID | Descrição |
|----|-----------|
| RF01 | O sistema deve permitir a criação de um ticket sem autenticação, informando aplicação, nome e descrição. |
| RF02 | O sistema deve gerar um número de protocolo único e legível para cada ticket criado. |
| RF03 | O sistema deve ignorar/sobrescrever qualquer valor de status, prioridade, tipo ou responsável enviado pelo cliente público na criação — esses campos são sempre definidos pelo servidor/triagem. |
| RF04 | O sistema deve exigir autenticação (Supabase Auth) para acesso ao painel interno. |
| RF05 | O sistema deve permitir listar e filtrar tickets por aplicação, status, prioridade e responsável. |
| RF06 | O sistema deve permitir a um agente definir prioridade, tipo e responsável de um ticket (triagem). |
| RF07 | O sistema deve permitir alterar o status de um ticket, registrando o histórico da mudança (status anterior, novo status, autor, data). |
| RF08 | O sistema deve permitir adicionar comentários internos a um ticket. |
| RF09 | O sistema deve permitir que um admin cadastre/edite/inative aplicações. |
| RF10 | O sistema deve permitir que um admin cadastre/edite colaboradores e seus papéis (admin/agente). |
| RF11 | Cada colaborador deve ter um Kanban pessoal, com colunas e tarefas próprias, não visível a outros colaboradores. |
| RF12 | Uma tarefa do Kanban pode referenciar um ticket existente, exibindo seu protocolo/título como contexto, sem alterar dados do ticket. |
| RF13 | O sistema deve suportar múltiplas aplicações cadastradas dinamicamente (sem alteração de código para adicionar uma nova aplicação/cliente). |

## 7. Requisitos Não-Funcionais

- **RNF01** — Sem backend próprio: toda a lógica de acesso a dados via Supabase Client SDK (RLS faz o papel de regra de negócio de autorização).
- **RNF02** — A criação pública de ticket usa a chave `anon` do Supabase; nenhuma leitura de dados sensíveis deve ser exposta a essa role.
- **RNF03** — Interface responsiva (o formulário público será acessado principalmente via link enviado a usuários leigos, possivelmente em mobile).
- **RNF04** — Stack: React 18+, TypeScript, Vite, Tailwind CSS, `@supabase/supabase-js`.
- **RNF05** — Proteção básica contra spam no formulário público (ex: honeypot field escondido; considerar rate limiting/captcha em versão futura).

## 8. Modelo de Dados (Supabase / PostgreSQL)

### 8.1 Diagrama de relacionamento (visão geral)

```
applications 1---N tickets N---1 profiles (assigned_to)
tickets 1---N ticket_comments N---1 profiles (author)
tickets 1---N ticket_status_history N---1 profiles (changed_by)
tickets 1---N kanban_tasks (referência opcional, sem FK obrigatória de negócio)
profiles 1---N kanban_columns 1---N kanban_tasks
auth.users 1---1 profiles
```

### 8.2 Enums

```sql
create type ticket_status as enum ('novo', 'triagem', 'em_andamento', 'aguardando_cliente', 'resolvido', 'fechado');
create type ticket_priority as enum ('baixa', 'media', 'alta', 'critica');
create type ticket_type as enum ('melhoria', 'correcao');
create type user_role as enum ('admin', 'agente');
```

### 8.3 Tabelas

```sql
-- Colaboradores da empresa (espelha auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'agente',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Aplicações/soluções da empresa (uma por cliente)
create table applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Tickets (solicitações de suporte)
create table tickets (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique, -- gerado via trigger, ex: SD-2026-00042
  application_id uuid not null references applications(id),
  requester_name text not null,
  requester_contact text, -- opcional: e-mail/telefone
  description text not null,
  status ticket_status not null default 'novo',
  priority ticket_priority, -- null até a triagem
  type ticket_type, -- null até a triagem
  assigned_to uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  triaged_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz
);

-- Comentários internos (uso exclusivo da equipe)
create table ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  author_id uuid not null references profiles(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Histórico de mudança de status (auditoria)
create table ticket_status_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  from_status ticket_status,
  to_status ticket_status not null,
  changed_by uuid references profiles(id),
  changed_at timestamptz not null default now()
);

-- Colunas do Kanban pessoal (uma por colaborador)
create table kanban_columns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  color text,
  created_at timestamptz not null default now()
);

-- Tarefas do Kanban pessoal
create table kanban_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  column_id uuid not null references kanban_columns(id) on delete cascade,
  title text not null,
  description text,
  ticket_id uuid references tickets(id) on delete set null, -- referência opcional, só contexto
  position integer not null default 0,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 8.4 Geração automática de protocolo

```sql
create sequence ticket_protocol_seq;

create or replace function set_ticket_protocol()
returns trigger as $$
begin
  new.protocol := 'SD-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('ticket_protocol_seq')::text, 5, '0');
  -- Reforça que campos de triagem nunca vêm do público, independente do payload enviado
  new.status := 'novo';
  new.priority := null;
  new.type := null;
  new.assigned_to := null;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_set_ticket_protocol
before insert on tickets
for each row execute function set_ticket_protocol();
```

```sql
create or replace function log_ticket_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into ticket_status_history (ticket_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  new.updated_at := now();
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_log_ticket_status_change
before update on tickets
for each row execute function log_ticket_status_change();
```

### 8.5 Row Level Security (RLS)

```sql
alter table applications enable row level security;
alter table tickets enable row level security;
alter table ticket_comments enable row level security;
alter table ticket_status_history enable row level security;
alter table kanban_columns enable row level security;
alter table kanban_tasks enable row level security;
alter table profiles enable row level security;

-- applications: leitura pública (para popular o dropdown do formulário)
create policy "applications_public_read_active"
  on applications for select
  to anon, authenticated
  using (active = true);

create policy "applications_admin_write"
  on applications for all
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- tickets: criação pública, leitura/gestão restrita à equipe
create policy "tickets_public_insert"
  on tickets for insert
  to anon
  with check (true); -- trigger garante que campos sensíveis sejam sobrescritos

create policy "tickets_staff_select"
  on tickets for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.active = true));

create policy "tickets_staff_update"
  on tickets for update
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.active = true));

-- comentários e histórico: só equipe autenticada
create policy "ticket_comments_staff_all"
  on ticket_comments for all
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.active = true))
  with check (author_id = auth.uid());

create policy "ticket_status_history_staff_select"
  on ticket_status_history for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.active = true));

-- kanban: estritamente privado ao dono
create policy "kanban_columns_owner_all"
  on kanban_columns for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "kanban_tasks_owner_all"
  on kanban_tasks for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- profiles: colaborador vê o próprio perfil; admin vê/gerencia todos
create policy "profiles_self_select"
  on profiles for select
  to authenticated
  using (id = auth.uid() or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "profiles_admin_write"
  on profiles for update
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
```

> Nota para o agente de implementação: a tabela `profiles` deve ser populada via trigger em `auth.users` (on insert) ou manualmente pelo admin ao convidar um colaborador — definir a abordagem mais simples possível para v1 (ex: trigger `handle_new_user`).

## 9. Arquitetura da Aplicação (Frontend)

Monolito React + TypeScript + Vite + Tailwind, consumindo Supabase diretamente via `@supabase/supabase-js`. Duas áreas claramente separadas por rota:

```
/                      -> Formulário público de abertura de chamado
/chamado-enviado/:protocol -> Confirmação com número de protocolo
/login                 -> Login da equipe (Supabase Auth)
/app                   -> Layout protegido (requer sessão)
  /app/fila            -> Fila de solicitações (dashboard de triagem, com filtros)
  /app/chamados/:id    -> Detalhe do ticket (triagem, status, comentários, histórico)
  /app/kanban          -> Kanban pessoal do colaborador logado
  /app/aplicacoes      -> CRUD de aplicações (somente admin)
  /app/equipe          -> Gestão de colaboradores/papéis (somente admin)
```

Estrutura de pastas sugerida:

```
src/
  lib/supabaseClient.ts
  types/                  (tipos gerados/derivados do schema)
  features/
    public-ticket/        (formulário público)
    auth/
    queue/                 (fila + filtros)
    ticket-detail/
    kanban/
    admin/
  components/ui/           (componentes reutilizáveis Tailwind)
  routes/
```

## 10. Layouts de Telas

### 10.1 Formulário público de abertura de chamado (`/`)

- Layout centralizado, single-column, mobile-first.
- Campos: **Aplicação** (select, populado de `applications` onde `active = true`), **Nome** (text), **Descrição do problema/solicitação** (textarea).
- Botão "Enviar solicitação".
- Sem menu, sem referência a login — tela minimalista e neutra (pode ser usada por clientes de qualquer aplicação).
- Após envio: redireciona para `/chamado-enviado/:protocol` exibindo o número de protocolo em destaque e uma mensagem de confirmação.

### 10.2 Login da equipe (`/login`)

- Formulário simples de e-mail/senha (Supabase Auth).

### 10.3 Fila de Solicitações (`/app/fila`)

- Barra de filtros no topo: Aplicação, Status, Prioridade, Responsável.
- Tabela/lista de tickets com colunas: Protocolo, Aplicação, Solicitante, Status (badge colorido), Prioridade (badge), Tipo, Responsável, Data de criação.
- Tickets com status `novo` destacados visualmente (ex: borda ou badge "Aguardando triagem").
- Clique na linha abre `/app/chamados/:id`.

### 10.4 Detalhe do Ticket (`/app/chamados/:id`)

- Cabeçalho: protocolo, aplicação, solicitante, descrição original (somente leitura).
- Painel de triagem/gestão: selects para Prioridade, Tipo, Responsável, Status.
- Linha do tempo/histórico de mudanças de status.
- Seção de comentários internos (lista + campo para novo comentário).

### 10.5 Kanban Pessoal (`/app/kanban`)

- Quadro estilo Trello: colunas do colaborador logado, cartões arrastáveis (drag and drop) entre colunas.
- Botão "Nova tarefa" por coluna.
- Cartão de tarefa: título, descrição opcional, badge opcional mostrando o protocolo do ticket referenciado (se houver), com link para abrir o ticket em `/app/chamados/:id`.
- Totalmente isolado: dados visíveis apenas para o próprio `owner_id`.

### 10.6 Administração — Aplicações (`/app/aplicacoes`, somente admin)

- Lista de aplicações cadastradas, com toggle de ativo/inativo.
- Formulário de criação/edição: nome, slug, descrição.

### 10.7 Administração — Equipe (`/app/equipe`, somente admin)

- Lista de colaboradores, papel (admin/agente), status ativo/inativo.
- Ação para alterar papel ou desativar colaborador.

## 11. Regras de Negócio

- Um ticket criado publicamente nunca chega com prioridade, tipo ou responsável definidos — isso é reforçado no banco (trigger), não apenas na interface.
- O Kanban pessoal é estritamente separado da fila oficial: mover um cartão de coluna, editar ou excluir uma tarefa **nunca** altera o ticket vinculado, seu status, prioridade ou SLA.
- Um mesmo ticket pode ser referenciado por tarefas de Kanban de colaboradores diferentes (é apenas leitura de contexto, sem exclusividade).
- Toda alteração de status de ticket gera um registro em `ticket_status_history`, automaticamente via trigger.
- Aplicações inativas (`active = false`) somem do formulário público, mas tickets antigos vinculados a elas continuam acessíveis no painel interno.

## 12. Roadmap Futuro (fora do escopo desta versão)

- Autenticação leve do solicitante (por e-mail) para consulta de status do próprio chamado.
- Anexos/upload de imagens no ticket (Supabase Storage).
- Notificações por e-mail (Resend) em mudanças de status.
- Cálculo automático de SLA por prioridade/aplicação e alertas de vencimento.
- Respostas visíveis ao solicitante (thread pública) além dos comentários internos.

## 13. Instruções para o Agente de Implementação (Gemini / Antigravity)

1. Usar o MCP do Supabase para criar o schema descrito na Seção 8 (enums, tabelas, triggers, RLS) diretamente no projeto Supabase conectado.
2. Gerar o frontend como projeto Vite + React + TypeScript + Tailwind CSS, seguindo a estrutura de pastas e rotas da Seção 9.
3. Implementar primeiro o fluxo público (Seção 10.1/10.2) e a fila de triagem (10.3/10.4), depois o Kanban (10.5), depois as telas de admin (10.6/10.7).
4. Usar `@supabase/supabase-js` diretamente nos componentes/hooks — não criar backend/API própria.
5. Gerar os tipos TypeScript a partir do schema Supabase (`supabase gen types typescript`) sempre que possível, em vez de tipar manualmente.
6. Priorizar simplicidade visual e responsividade sobre recursos avançados nesta primeira versão.
