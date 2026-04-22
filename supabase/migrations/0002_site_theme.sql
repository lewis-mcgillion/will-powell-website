alter table public.site_settings
  add column if not exists theme_key text not null default 'classic-navy';
