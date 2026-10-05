-- EFSW Content table — drop and recreate is safe if you're seeding fresh.
-- In production replace with ALTER TABLE migrations.

create table if not exists public.content (
  id            text primary key,
  kind          text not null check (kind in ('news', 'document', 'event')),
  category      text not null default 'General',
  title         text not null,
  summary       text not null default '',
  body          text not null default '',
  cover_image   text,
  image_caption text,
  author        text,
  tags          text[]      not null default '{}',
  status        text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  locale        text not null default 'en'    check (locale in ('en', 'th', 'ko')),
  updated_at    timestamptz not null default now(),
  starts_at     timestamptz,
  ends_at       timestamptz,
  venue         text,
  format        text,
  registration_url text,
  created_at    timestamptz not null default now()
);

-- Fast filters for the public feed
create index if not exists content_kind_status_idx on public.content (kind, status);
create index if not exists content_kind_id_idx    on public.content (kind, id);
create index if not exists content_updated_idx    on public.content (updated_at desc);

-- RLS: allow authenticated admin (via service_role) full access;
-- allow anonymous/public read of published rows only.
alter table public.content enable row level security;

create policy "public read published" on public.content
  for select
  using (status = 'published');

create policy "admin full access" on public.content
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Tell PostgREST the table is readable by the anon key for public reads.
-- (The service role bypasses RLS anyway.)
-- NOTE: if you also want anon INSERT (don't!), add a separate policy.
