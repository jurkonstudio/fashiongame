-- FashionGame online | 0001 skema inti. Semua uang dalam USD (tampilan Rp/$ mengikuti bahasa di klien).
create table game_config (key text primary key, value numeric not null);

create table item_types (
  id text primary key,                         -- 'cotton','thread','shoes'
  kind text not null check (kind in ('raw','material','product')),
  name_id text not null, name_en text not null,
  base_price numeric not null check (base_price > 0),
  unlock_level int not null default 1
);

create table recipes (
  id text primary key,
  output_item text not null references item_types(id),
  output_qty int not null check (output_qty > 0),
  seconds int not null check (seconds > 0),    -- waktu 1 batch di fasilitas level 1
  facility_type text not null,                 -- 'factory'
  unlock_level int not null default 1
);
create table recipe_inputs (
  recipe_id text references recipes(id) on delete cascade,
  item_id text references item_types(id),
  qty int not null check (qty > 0),
  primary key (recipe_id, item_id)
);

create table facility_types (
  type text primary key,                       -- office, factory, store, warehouse, farm
  base_cost numeric not null,                  -- biaya naik level 1 -> 2
  base_seconds int not null,                   -- waktu naik level, dikali level saat ini
  build_cost numeric not null,                 -- biaya bangun pertama
  build_seconds int not null,
  rent_hour numeric not null default 4
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 30),
  cash numeric(14,2) not null default 500 check (cash >= 0),
  debt numeric(14,2) not null default 0 check (debt >= 0),
  buttons int not null default 0 check (buttons >= 0),   -- Kancing Emas
  level int not null default 1,
  reputation numeric not null default 10 check (reputation between 0 and 100),
  made int not null default 0, sold int not null default 0, revenue numeric not null default 0,
  last_costs_at timestamptz not null default now(),
  last_login_bonus date,
  created_at timestamptz not null default now()
);

create table facilities (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  slot int not null check (slot between 0 and 9),
  type text not null references facility_types(type),
  level int not null default 0,                -- 0 = sedang dibangun pertama kali
  target_level int,                            -- terisi saat build/upgrade berjalan
  build_until timestamptz,
  unique (brand_id, slot)
);

create table inventory (
  brand_id uuid not null references brands(id) on delete cascade,
  item_id text not null references item_types(id),
  quality int not null check (quality between 1 and 5),
  qty numeric not null default 0 check (qty >= 0),
  avg_cost numeric not null default 0,
  primary key (brand_id, item_id, quality)     -- satu tumpukan per kualitas
);

create table production_orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  facility_id uuid not null references facilities(id),
  recipe_id text not null references recipes(id),
  runs int not null check (runs between 1 and 20),
  quality int not null check (quality between 1 and 5),
  input_cost numeric not null default 0,
  finish_at timestamptz not null,
  status text not null default 'running' check (status in ('running','claimed'))
);
create index on production_orders (brand_id, status);

create table npc_market (
  item_id text primary key references item_types(id),
  price_index numeric not null default 1,      -- naik/turun acak, kembali ke 1
  saturation numeric not null default 0,       -- naik saat pemain menjual, turun tiap jam
  updated_at timestamptz not null default now()
);
create table price_history (
  item_id text references item_types(id), at timestamptz default now(), price numeric not null,
  primary key (item_id, at)
);

create table designs (                         -- desain dinilai Claude AI (NPC kritikus)
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  category text not null references item_types(id),
  attrs jsonb not null default '{}',           -- gaya, warna, bahan (pilihan terbatas, bukan unggah gambar)
  score int check (score between 0 and 100),   -- diisi Edge Function, bukan klien
  review text, scored_at timestamptz,
  created_at timestamptz not null default now()
);

create table ledger (                          -- catatan uang append-only
  id bigint generated always as identity primary key,
  brand_id uuid not null references brands(id) on delete cascade,
  kind text not null,                          -- sale, purchase, wage, rent, tax, loan, build, bonus
  amount numeric not null,                     -- + masuk / - keluar
  balance_after numeric not null,
  note text, created_at timestamptz not null default now()
);
create index on ledger (brand_id, id desc);

create table notifications (
  id bigint generated always as identity primary key,
  brand_id uuid not null references brands(id) on delete cascade,
  text text not null, read boolean not null default false, created_at timestamptz not null default now()
);
