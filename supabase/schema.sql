-- Recepción de mercancía · Enjoy Videogames
-- Se ejecuta UNA vez en el mismo proyecto de Supabase que el control de garantías
-- (SQL Editor > New query > pegar todo > Run). No toca las tablas de garantías.
-- Usa los mismos usuarios de Authentication.

-- 1. Recepciones (una por cada llegada de mercancía)
create table if not exists public.recepciones (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (length(nombre) between 1 and 120),
  estado      text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  creada      timestamptz not null default now(),
  creada_por  text not null default coalesce(auth.jwt() ->> 'email', ''),
  cerrada     timestamptz
);

-- 2. Productos de cada recepción. "clave" identifica el producto dentro de la recepción
--    (p<id woo>, t-<texto libre>, con sufijos -ob = open box y -kg = por peso).
create table if not exists public.recepcion_lineas (
  recepcion_id uuid not null references public.recepciones (id) on delete cascade,
  clave        text not null check (length(clave) between 1 and 120),
  seccion      text not null,
  nombre       text not null check (length(nombre) between 1 and 300),
  woo_id       bigint,
  sku          text not null default '',
  unidad       text not null default 'u' check (unidad in ('u', 'kg')),
  estado       text not null default 'Nuevo' check (estado in ('Nuevo', 'Open box')),
  creada       timestamptz not null default now(),
  creada_por   text not null default coalesce(auth.jwt() ->> 'email', ''),
  primary key (recepcion_id, clave)
);

-- 3. Conteos: una fila por producto y persona. Cada uno suma en la suya,
--    así dos personas contando a la vez no se pisan.
create table if not exists public.recepcion_conteos (
  recepcion_id uuid not null,
  clave        text not null,
  usuario      text not null,
  cantidad     numeric(10, 2) not null default 0 check (cantidad >= 0),
  actualizado  timestamptz not null default now(),
  actualizado_por text not null default coalesce(auth.jwt() ->> 'email', ''),
  primary key (recepcion_id, clave, usuario),
  foreign key (recepcion_id, clave)
    references public.recepcion_lineas (recepcion_id, clave) on delete cascade
);

-- 4. Seguridad: solo usuarios con sesión iniciada (igual que garantías).
alter table public.recepciones       enable row level security;
alter table public.recepcion_lineas  enable row level security;
alter table public.recepcion_conteos enable row level security;

drop policy if exists recepciones_todo on public.recepciones;
create policy recepciones_todo on public.recepciones
  for all to authenticated using (true) with check (true);

drop policy if exists lineas_todo on public.recepcion_lineas;
create policy lineas_todo on public.recepcion_lineas
  for all to authenticated using (true) with check (true);

drop policy if exists conteos_todo on public.recepcion_conteos;
create policy conteos_todo on public.recepcion_conteos
  for all to authenticated using (true) with check (true);

revoke all on public.recepciones, public.recepcion_lineas, public.recepcion_conteos from anon;
grant select, insert, update, delete
  on public.recepciones, public.recepcion_lineas, public.recepcion_conteos to authenticated;

-- 5. Tiempo real: los 3 móviles ven los cambios al instante.
--    "replica identity full" hace que los borrados lleguen con recepcion_id.
alter table public.recepciones       replica identity full;
alter table public.recepcion_lineas  replica identity full;
alter table public.recepcion_conteos replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'recepciones') then
    alter publication supabase_realtime add table public.recepciones;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'recepcion_lineas') then
    alter publication supabase_realtime add table public.recepcion_lineas;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'recepcion_conteos') then
    alter publication supabase_realtime add table public.recepcion_conteos;
  end if;
end $$;

create index if not exists recepcion_conteos_recepcion on public.recepcion_conteos (recepcion_id);
