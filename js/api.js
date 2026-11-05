// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { SUPABASE_URL as U, SUPABASE_KEY as K } from './config.js?v=11';
let sb = null, uid = null;
export const status = { mode: U && K ? 'connecting' : 'offline', err: '', clock: false };   // offline | cloud | error
const fail = (where, e) => { console.error(where, e); status.err = where + ': ' + (e?.message || e); if (status.mode !== 'offline') status.mode = 'error'; };
export async function init() {
  if (!U || !K) return;
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
    sb = createClient(U, K);
    let { data } = await sb.auth.getSession();
    if (!data.session) { const r = await sb.auth.signInAnonymously(); if (r.error) throw r.error; }
    uid = (await sb.auth.getUser()).data.user.id;
    const t = await sb.from('saves').select('user_id').limit(1);      // tes tabel + RLS
    if (t.error) throw t.error;
    status.mode = 'cloud';
  } catch (e) { sb = null; fail('Supabase', e); }                      // gagal -> main offline, game tetap jalan
}
export async function load() {
  if (sb) { try { const { data, error } = await sb.from('saves').select('state').eq('user_id', uid).maybeSingle(); if (error) throw error; return data?.state || null; } catch (e) { fail('load', e); } }
  try { return JSON.parse(localStorage.getItem('fg')); } catch { return null; }
}
export async function save(state) {
  try { localStorage.setItem('fg', JSON.stringify(state)); } catch {}
  if (sb) { try { const { error } = await sb.from('saves').upsert({ user_id: uid, state }); if (error) throw error; if (status.mode === 'error') { status.mode = 'cloud'; status.err = ''; } } catch (e) { fail('save', e); } }
}
export async function serverOffset() {   // selisih jam server (RPC server_now) terhadap jam perangkat, ms
  if (!sb) return 0;
  try { const a = Date.now(), { data, error } = await sb.rpc('server_now'), b = Date.now(); if (error) throw error;
    status.clock = true; return new Date(data).getTime() - (a + b) / 2; } catch (e) { status.clock = false; fail('server_now', e); return 0; }
}
