create table if not exists public.site_settings (
  id text primary key default 'site-settings',
  business_name text not null,
  tagline text not null default '',
  phone text not null default '',
  email text not null default '',
  whatsapp_number text not null default '',
  primary_area text not null default '',
  opening_hours text not null default '',
  google_reviews_url text not null default '',
  theme_key text not null default 'classic-navy',
  updated_at timestamptz not null default now()
);

create table if not exists public.homepage_sections (
  id text primary key,
  section_type text not null,
  title text not null default '',
  subtitle text not null default '',
  body text not null default '',
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_cards (
  id text primary key,
  title text not null,
  short_description text not null default '',
  common_faults text[] not null default '{}',
  icon_label text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id text primary key,
  quote text not null,
  customer_name text not null default '',
  location text not null default '',
  rating integer not null default 5,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id text primary key,
  question text not null,
  answer text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new',
  customer_name text not null,
  phone text not null,
  email text,
  postcode text not null,
  appliance_type text not null,
  brand text,
  fault_description text not null,
  preferred_contact_method text not null default 'Phone',
  preferred_window text,
  source_path text,
  email_delivery_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.repair_request_notes (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.repair_request_events (
  id uuid primary key default gen_random_uuid(),
  repair_request_id uuid not null references public.repair_requests(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.service_cards enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.repair_requests enable row level security;
alter table public.repair_request_notes enable row level security;
alter table public.repair_request_events enable row level security;

create policy "public can read site settings" on public.site_settings for select using (true);
create policy "public can read visible sections" on public.homepage_sections for select using (is_visible = true or auth.role() = 'authenticated');
create policy "public can read visible services" on public.service_cards for select using (is_visible = true or auth.role() = 'authenticated');
create policy "public can read visible testimonials" on public.testimonials for select using (is_visible = true or auth.role() = 'authenticated');
create policy "public can read visible faqs" on public.faqs for select using (is_visible = true or auth.role() = 'authenticated');

create policy "admins can manage site settings" on public.site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can manage homepage sections" on public.homepage_sections for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can manage services" on public.service_cards for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can manage testimonials" on public.testimonials for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can manage faqs" on public.faqs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can read repair requests" on public.repair_requests for select using (auth.role() = 'authenticated');
create policy "admins can update repair requests" on public.repair_requests for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can manage repair notes" on public.repair_request_notes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admins can read repair events" on public.repair_request_events for select using (auth.role() = 'authenticated');
