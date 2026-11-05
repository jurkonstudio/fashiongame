// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { SUPABASE_URL as U, SUPABASE_KEY as K } from './config.js';
let sb = null, uid = null;
export async function init() {
  if (!U || !K) return;
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
  sb = createClient(U, K);
  let { data } = await sb.auth.getSession();
  if (!data.session) await sb.auth.signInAnonymously();
  uid = (await sb.auth.getUser()).data.user.id;
}
export async function load() {
  if (sb) { const { data } = await sb.from('saves').select('state').eq('user_id', uid).maybeSingle(); return data?.state || null; }
  try { return JSON.parse(localStorage.getItem('fg')); } catch { return null; }
}
export async function save(state) {
  if (sb) { await sb.from('saves').upsert({ user_id: uid, state, updated_at: new Date().toISOString() }); return; }
  try { localStorage.setItem('fg', JSON.stringify(state)); } catch {}
}
export async function serverOffset() {   // selisih jam server (RPC server_now) terhadap jam perangkat, ms
  if (!sb) return 0;
  try { const a = Date.now(), { data, error } = await sb.rpc('server_now'), b = Date.now();
    return error || !data ? 0 : new Date(data).getTime() - (a + b) / 2; } catch { return 0; }
}
