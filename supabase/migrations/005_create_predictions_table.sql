-- Create predictions table
create table if not exists public.predictions (
    id uuid primary key default gen_random_uuid(),
    home_team text not null,
    away_team text not null,
    match_date date not null,
    league text not null,
    model_type text not null check (model_type in ('form', 'h2h', 'ensemble')),
    prediction jsonb not null,
    confidence numeric(4,3) check (confidence >= 0 and confidence <= 1),
    cache_key text not null,
    generated_at timestamptz not null default now(),
    constraint predictions_unique_match_model unique (home_team, away_team, match_date, model_type)
);

-- Indexes for performance
create index if not exists idx_predictions_cache_key on public.predictions (cache_key);
create index if not exists idx_predictions_match_date on public.predictions (match_date desc);
create index if not exists idx_predictions_league on public.predictions (league);

-- Row Level Security
alter table public.predictions enable row level security;

-- Only allow SELECT for anon users
create policy "Allow read for anon" on public.predictions
    for select using (true);

-- Allow insert/update for service role
create policy "Allow insert/update for service role" on public.predictions
    for all using (
        auth.role() = 'service_role'
    );

-- Cleanup function
create or replace function public.cleanup_old_predictions() returns void as $$
begin
    delete from public.predictions
    where generated_at < now() - interval '30 days';
end;
$$ language plpgsql;

-- Schedule cleanup daily
select cron.schedule('cleanup_predictions', '0 3 * * *', $$
    select public.cleanup_old_predictions();
$$);
