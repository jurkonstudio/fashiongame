-- 0002 RLS: pemain hanya BACA data miliknya. Semua tulis lewat fungsi server (0003).
do $$ declare t text; begin
  foreach t in array array['game_config','item_types','recipes','recipe_inputs','facility_types','brands','facilities','inventory','production_orders','npc_market','price_history','designs','ledger','notifications'] loop
    execute format('alter table %I enable row level security', t);
    execute format('revoke insert, update, delete on %I from anon, authenticated', t);
  end loop; end $$;

create or replace function my_brand() returns uuid language sql stable security definer set search_path = public as
$$ select id from brands where owner_id = auth.uid() $$;

-- katalog & pasar NPC: terbaca semua pemain login
create policy read_all on game_config for select to authenticated using (true);
create policy read_all on item_types for select to authenticated using (true);
create policy read_all on recipes for select to authenticated using (true);
create policy read_all on recipe_inputs for select to authenticated using (true);
create policy read_all on facility_types for select to authenticated using (true);
create policy read_all on npc_market for select to authenticated using (true);
create policy read_all on price_history for select to authenticated using (true);
-- data milik sendiri
create policy own on brands for select to authenticated using (owner_id = auth.uid());
create policy own on facilities for select to authenticated using (brand_id = my_brand());
create policy own on inventory for select to authenticated using (brand_id = my_brand());
create policy own on production_orders for select to authenticated using (brand_id = my_brand());
create policy own on designs for select to authenticated using (brand_id = my_brand());
create policy own on ledger for select to authenticated using (brand_id = my_brand());
create policy own on notifications for select to authenticated using (brand_id = my_brand());

-- realtime hanya untuk harga pasar
alter publication supabase_realtime add table npc_market;
