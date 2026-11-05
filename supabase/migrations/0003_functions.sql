-- 0003 fungsi server (security definer). Klien hanya memanggil rpc(); tidak pernah menulis tabel langsung.
create or replace function cfg(k text) returns numeric language sql stable as $$ select value from game_config where key = k $$;
create or replace function qmult(q numeric) returns numeric language sql immutable as $$ select 0.6 + 0.2 * q $$;

create or replace function npc_price(p_item text, p_q int) returns numeric language sql stable as $$
  select it.base_price * qmult(p_q) * m.price_index * (1 - 0.4 * least(1, m.saturation))
  from item_types it join npc_market m on m.item_id = it.id where it.id = p_item $$;

-- catat uang + saldo (dipanggil dari fungsi lain; kas kurang untuk biaya otomatis jadi hutang)
create or replace function pay(p_brand uuid, p_amount numeric, p_kind text, p_note text default null, p_allow_debt boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare b brands; begin
  select * into b from brands where id = p_brand for update;
  if p_amount < 0 then
    if b.cash + p_amount >= 0 then update brands set cash = cash + p_amount where id = p_brand;
    elsif p_allow_debt then update brands set debt = debt + (-p_amount - cash), cash = 0 where id = p_brand;
    else raise exception 'insufficient cash'; end if;
  else update brands set cash = cash + p_amount where id = p_brand; end if;
  insert into ledger (brand_id, kind, amount, balance_after, note)
    values (p_brand, p_kind, p_amount, (select cash from brands where id = p_brand), p_note);
end $$;

-- selesaikan bangunan/upgrade yang timernya lewat (dipanggil lazy di awal setiap aksi)
create or replace function settle_builds(p_brand uuid) returns void language sql security definer set search_path = public as $$
  update facilities set level = target_level, target_level = null, build_until = null
  where brand_id = p_brand and target_level is not null and build_until is not null and build_until <= now() $$;

create or replace function create_brand(p_name text) returns uuid language plpgsql security definer set search_path = public as $$
declare bid uuid; begin
  if auth.uid() is null then raise exception 'login required'; end if;
  insert into brands (owner_id, name, cash) values (auth.uid(), p_name, cfg('start_cash')) returning id into bid;
  insert into facilities (brand_id, slot, type, level) values (bid, 0, 'office', 1);
  insert into ledger (brand_id, kind, amount, balance_after, note) values (bid, 'bonus', cfg('start_cash'), cfg('start_cash'), 'start');
  return bid; end $$;

create or replace function claim_login_bonus() returns int language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); b brands; begin
  select * into b from brands where id = bid for update;
  if b.last_login_bonus = current_date then return 0; end if;
  update brands set buttons = buttons + cfg('btn_login')::int, last_login_bonus = current_date where id = bid;
  return cfg('btn_login')::int; end $$;

-- bangun fasilitas baru di slot kosong
create or replace function build_facility(p_slot int, p_type text) returns void language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); ft facility_types; begin
  perform settle_builds(bid); select * into ft from facility_types where type = p_type;
  if ft.type is null or p_type = 'office' then raise exception 'bad type'; end if;
  perform pay(bid, -ft.build_cost, 'build', p_type);
  insert into facilities (brand_id, slot, type, level, target_level, build_until)
    values (bid, p_slot, p_type, 0, 1, now() + make_interval(secs => ft.build_seconds)); end $$;

-- upgrade: biaya = base_cost * 1.8^(level-1); waktu = base_seconds * level; maks level = 2 + level pemain
create or replace function upgrade_facility(p_facility uuid) returns void language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); f facilities; ft facility_types; b brands; begin
  perform settle_builds(bid);
  select * into f from facilities where id = p_facility and brand_id = bid for update;
  select * into b from brands where id = bid;
  select * into ft from facility_types where type = f.type;
  if f.id is null or f.build_until is not null then raise exception 'busy'; end if;
  if f.level >= 2 + b.level then raise exception 'level cap'; end if;
  perform pay(bid, -round(ft.base_cost * power(1.8, f.level - 1)), 'build', 'upgrade ' || f.type);
  update facilities set target_level = level + 1, build_until = now() + make_interval(secs => ft.base_seconds * f.level) where id = f.id; end $$;

-- percepat selesai bangunan dengan Kancing Emas (1 per 30 menit tersisa). HANYA bangunan/upgrade.
create or replace function speedup_build(p_facility uuid) returns int language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); f facilities; cost int; begin
  select * into f from facilities where id = p_facility and brand_id = bid for update;
  if f.build_until is null or f.build_until <= now() then raise exception 'nothing to speed up'; end if;
  cost := greatest(1, ceil(extract(epoch from f.build_until - now()) / cfg('btn_speed_sec'))::int);
  update brands set buttons = buttons - cost where id = bid;      -- check constraint menolak jika kurang
  update facilities set build_until = now() where id = f.id;
  perform settle_builds(bid); return cost; end $$;

-- beli bahan mentah/material dari supplier NPC (kualitas 1 murah, 2 standar, 3 premium)
create or replace function buy_from_npc(p_item text, p_qty int, p_q int default 2) returns numeric language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); it item_types; unit numeric; total numeric; begin
  select * into it from item_types where id = p_item and kind in ('raw','material');
  if it.id is null or p_qty < 1 or p_qty > 1000 or p_q not between 1 and 3 then raise exception 'bad request'; end if;
  unit := npc_price(p_item, p_q) / qmult(p_q) * (case p_q when 1 then 0.8 when 3 then 1.3 else 1 end) * (1 + 0.002 * p_qty / 2);
  total := round(unit * p_qty, 2);
  perform pay(bid, -total, 'purchase', p_item || ' x' || p_qty);
  insert into inventory (brand_id, item_id, quality, qty, avg_cost) values (bid, p_item, p_q, p_qty, unit)
    on conflict (brand_id, item_id, quality) do update
      set avg_cost = (inventory.avg_cost * inventory.qty + excluded.avg_cost * excluded.qty) / (inventory.qty + excluded.qty), qty = inventory.qty + excluded.qty;
  update npc_market set price_index = least(1.6, price_index + 0.002 * p_qty) where item_id = p_item;   -- beli banyak menaikkan harga
  return total; end $$;

-- mulai produksi: bahan kualitas p_q dipakai semua; hasil berkualitas p_q. Slot paralel = level pabrik.
create or replace function start_production(p_facility uuid, p_recipe text, p_runs int, p_q int) returns uuid language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); f facilities; r recipes; b brands; ri record; cost numeric := 0; inv inventory; oid uuid; secs numeric; begin
  perform settle_builds(bid);
  select * into f from facilities where id = p_facility and brand_id = bid for update;
  select * into r from recipes where id = p_recipe; select * into b from brands where id = bid;
  if f.id is null or f.build_until is not null or f.level < 1 or f.type <> r.facility_type then raise exception 'facility unavailable'; end if;
  if r.unlock_level > b.level or p_runs not between 1 and 20 or p_q not between 1 and 5 then raise exception 'bad request'; end if;
  if (select count(*) from production_orders where facility_id = f.id and status = 'running') >= f.level then raise exception 'no free slot'; end if;
  for ri in select * from recipe_inputs where recipe_id = p_recipe loop
    select * into inv from inventory where brand_id = bid and item_id = ri.item_id and quality = p_q for update;
    if inv.qty is null or inv.qty < ri.qty * p_runs then raise exception 'missing %', ri.item_id; end if;
    cost := cost + inv.avg_cost * ri.qty * p_runs;
    update inventory set qty = qty - ri.qty * p_runs where brand_id = bid and item_id = ri.item_id and quality = p_q;
  end loop;
  secs := r.seconds * p_runs * power(0.9, f.level - 1);
  insert into production_orders (brand_id, facility_id, recipe_id, runs, quality, input_cost, finish_at)
    values (bid, f.id, p_recipe, p_runs, p_q, cost, now() + make_interval(secs => secs)) returning id into oid;
  return oid; end $$;

create or replace function claim_production(p_order uuid) returns void language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); o production_orders; r recipes; n int; begin
  select * into o from production_orders where id = p_order and brand_id = bid and status = 'running' for update;
  if o.id is null or o.finish_at > now() then raise exception 'not ready'; end if;
  select * into r from recipes where id = o.recipe_id; n := r.output_qty * o.runs;
  update production_orders set status = 'claimed' where id = o.id;
  insert into inventory (brand_id, item_id, quality, qty, avg_cost) values (bid, r.output_item, o.quality, n, o.input_cost / n)
    on conflict (brand_id, item_id, quality) do update
      set avg_cost = (inventory.avg_cost * inventory.qty + excluded.avg_cost * excluded.qty) / (inventory.qty + excluded.qty), qty = inventory.qty + excluded.qty;
  update brands set made = made + n, buttons = buttons + cfg('btn_make')::int where id = bid; end $$;

-- jual produk ke NPC. Butuh Toko; maks per jual = 10 x level toko. Pajak 11%. Jual banyak -> pasar jenuh -> harga turun.
create or replace function sell_to_npc(p_item text, p_q int, p_qty int) returns numeric language plpgsql security definer set search_path = public as $$
declare bid uuid := my_brand(); st facilities; unit numeric; rev numeric; tax numeric; begin
  perform settle_builds(bid);
  select * into st from facilities where brand_id = bid and type = 'store' and level >= 1 order by level desc limit 1;
  if st.id is null then raise exception 'store required'; end if;
  if p_qty < 1 or p_qty > 10 * st.level then raise exception 'over capacity'; end if;
  if not exists (select 1 from item_types where id = p_item and kind = 'product') then raise exception 'not a product'; end if;
  update inventory set qty = qty - p_qty where brand_id = bid and item_id = p_item and quality = p_q;   -- check qty >= 0 menolak jika kurang
  if not found then raise exception 'no stock'; end if;
  unit := npc_price(p_item, p_q); rev := round(unit * p_qty, 2); tax := round(rev * cfg('tax'), 2);
  perform pay(bid, rev - tax, 'sale', p_item || ' x' || p_qty);
  update npc_market set saturation = saturation + p_qty / cfg('market_depth') where item_id = p_item;
  update brands set sold = sold + p_qty, revenue = revenue + rev, buttons = buttons + cfg('btn_sell')::int,
    reputation = least(100, reputation + p_qty * 0.05 * (1 + (p_q - 2) * 3)) where id = bid;
  return rev - tax; end $$;

-- ===== dijalankan pg_cron =====
create or replace function market_tick() returns void language plpgsql security definer set search_path = public as $$
begin
  update npc_market set price_index = least(1.5, greatest(0.7, price_index + 0.3 * (1 - price_index) + (random() * 2 - 1) * 0.08)),
    saturation = saturation * 0.7, updated_at = now();
  insert into price_history (item_id, price) select item_id, npc_price(item_id, 2) from npc_market; end $$;

create or replace function costs_tick() returns void language plpgsql security definer set search_path = public as $$
declare b record; hrs numeric; rent numeric; begin
  for b in select id, last_costs_at from brands loop
    hrs := least(48, extract(epoch from now() - b.last_costs_at) / 3600);
    select coalesce(sum(greatest(f.level, 1) * ft.rent_hour), 0) into rent from facilities f join facility_types ft using (type) where f.brand_id = b.id;
    if round(rent * hrs, 2) > 0 then perform pay(b.id, -round(rent * hrs, 2), 'rent', null, true); end if;
    update brands set last_costs_at = now(), debt = debt * (1 + cfg('loan_rate') * hrs) where id = b.id;
  end loop; end $$;

-- select cron.schedule('market', '0 * * * *', 'select market_tick()');
-- select cron.schedule('costs',  '5 * * * *', 'select costs_tick()');

-- izinkan pemain memanggil fungsi aksi (bukan pay/ticks)
revoke all on function pay(uuid, numeric, text, text, boolean), market_tick(), costs_tick(), settle_builds(uuid) from public, anon, authenticated;
grant execute on function create_brand(text), claim_login_bonus(), build_facility(int, text), upgrade_facility(uuid), speedup_build(uuid), buy_from_npc(text, int, int), start_production(uuid, text, int, int), claim_production(uuid), sell_to_npc(text, int, int), npc_price(text, int) to authenticated;
