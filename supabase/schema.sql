-- Jalankan SELURUHNYA di Supabase > SQL Editor (aman dijalankan ulang)
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists "own save select" on public.saves;
drop policy if exists "own save insert" on public.saves;
drop policy if exists "own save update" on public.saves;
create policy "own save select" on public.saves for select using (auth.uid() = user_id);
create policy "own save insert" on public.saves for insert with check (auth.uid() = user_id);
create policy "own save update" on public.saves for update using (auth.uid() = user_id);

-- Jam server: dipakai game agar semua timer (produksi, jual, upgrade) tidak bisa dimajukan lewat jam HP
create or replace function public.server_now() returns timestamptz language sql stable as $$ select now() $$;
grant execute on function public.server_now() to anon, authenticated;

-- updated_at selalu diisi server
create or replace function public.touch_save() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before insert or update on public.saves for each row execute function public.touch_save();
