
-- 1) Tabela de tags
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.tags enable row level security;

create policy "Users can view their own tags"
  on public.tags for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tags"
  on public.tags for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tags"
  on public.tags for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own tags"
  on public.tags for delete
  using (auth.uid() = user_id);

-- Índice único para evitar duplicação por usuário (case-insensitive)
create unique index if not exists unique_tag_name_per_user
  on public.tags (user_id, lower(name));

-- Trigger updated_at
create or replace function public.tags_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tags_set_updated_at on public.tags;
create trigger trg_tags_set_updated_at
before update on public.tags
for each row execute procedure public.tags_set_updated_at();

-- Validação de nome não-vazio via trigger (evitar CHECK imutável)
create or replace function public.tags_validate_name()
returns trigger
language plpgsql
as $$
begin
  if new.name is null or length(btrim(new.name)) = 0 then
    raise exception 'Tag name cannot be empty';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tags_validate_name on public.tags;
create trigger trg_tags_validate_name
before insert or update on public.tags
for each row execute procedure public.tags_validate_name();

-- Índice auxiliar de busca
create index if not exists idx_tags_user_name_lower
  on public.tags (user_id, lower(name));



-- 2) Tabela de junção transaction_tags
create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

alter table public.transaction_tags enable row level security;

-- Políticas
create policy "Users can view their own transaction_tags"
  on public.transaction_tags for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transaction_tags"
  on public.transaction_tags for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags tg
      where tg.id = tag_id and tg.user_id = auth.uid()
    )
  );

create policy "Users can update their own transaction_tags"
  on public.transaction_tags for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.transactions t
      where t.id = transaction_id and t.user_id = auth.uid()
    )
    and exists (
      select 1 from public.tags tg
      where tg.id = tag_id and tg.user_id = auth.uid()
    )
  );

create policy "Users can delete their own transaction_tags"
  on public.transaction_tags for delete
  using (auth.uid() = user_id);

-- Trigger de segurança/qualidade: preencher user_id e validar propriedade
create or replace function public.transaction_tags_enforce_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Atribui user_id atual se vier nulo
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;

  -- Garante que o lançamento pertence ao usuário
  perform 1 from public.transactions t
   where t.id = new.transaction_id and t.user_id = auth.uid();
  if not found then
    raise exception 'Transaction does not belong to the current user';
  end if;

  -- Garante que a tag pertence ao usuário
  perform 1 from public.tags tg
   where tg.id = new.tag_id and tg.user_id = auth.uid();
  if not found then
    raise exception 'Tag does not belong to the current user';
  end if;

  -- Garante que user_id do vínculo é do dono atual
  if new.user_id <> auth.uid() then
    raise exception 'Invalid user_id for transaction_tags';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_transaction_tags_enforce_user on public.transaction_tags;
create trigger trg_transaction_tags_enforce_user
before insert or update on public.transaction_tags
for each row execute procedure public.transaction_tags_enforce_user();

-- Índices para filtros e junções
create index if not exists idx_transaction_tags_user_tag
  on public.transaction_tags (user_id, tag_id);

create index if not exists idx_transaction_tags_user_transaction
  on public.transaction_tags (user_id, transaction_id);
