-- Monitor shift sessions: one monitor turn can include independently ending model shifts.
create table if not exists public.monitor_turnos (
  id uuid primary key default gen_random_uuid(),
  monitor_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null default current_date,
  jornada text not null,
  jornadas_cubiertas text[] not null default '{}',
  tipo_turno text not null default 'normal',
  hora_inicio time,
  hora_fin time,
  pendientes text,
  observaciones text,
  estado text not null default 'abierto',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

alter table public.turnos
  add column if not exists monitor_turno_id uuid references public.monitor_turnos(id) on delete set null,
  add column if not exists sala text;

create index if not exists monitor_turnos_monitor_fecha_idx
  on public.monitor_turnos (monitor_id, fecha desc);
create index if not exists turnos_monitor_turno_id_idx
  on public.turnos (monitor_turno_id);

alter table public.monitor_turnos enable row level security;
drop policy if exists elite_admin_full_access on public.monitor_turnos;
create policy elite_admin_full_access on public.monitor_turnos
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

-- New public tables are not auto-exposed; grant only to authenticated users and rely on RLS.
grant select, insert, update, delete on public.monitor_turnos to authenticated;
