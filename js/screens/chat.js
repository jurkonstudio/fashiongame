// (c) 2026 FashionGame. Obrolan lokal (tahap 1): pesan disimpan di G.S.chat. Supabase menyusul.
import { T } from '../i18n.js?v=28';
import { ic } from '../icons.js?v=28';
import { G, now } from '../state.js?v=28';

const ROOMS = [['gen', 'chat', 'ch_gen'], ['trade', 'money', 'ch_trade'], ['help', 'star', 'ch_help'], ['asst', 'profile', 'ct_asst']];
const SEED = { gen: 'seed_gen', trade: 'seed_trade', help: 'seed_help', asst: 'seed_asst' };
let cur = 'gen';
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const box = () => { const S = G.S; S.chat = S.chat || {};
  for (const k in SEED) if (!S.chat[k]) S.chat[k] = [{ n: k === 'asst' ? T('ct_asst') : 'FashionGame', t: T(SEED[k]) }];
  return S.chat; };

export const view = () => { const B = box();
  const rail = ROOMS.map(([k, i, l]) => `<button class="${k === cur ? 'on' : ''}" data-a="chsel:${k}" aria-label="${T(l)}">${ic(i)}<span>${T(l)}</span></button>`).join('');
  const msgs = (B[cur] || []).slice(-40).map(m => `<div class="cm${m.me ? ' me' : ''}"><b>${esc(m.n)}</b> ${esc(m.t)}</div>`).join('');
  return `<h2>${ic('chat')} ${T('chat')}</h2><div class="chat"><div class="crail">${rail}</div><div class="cmain"><div class="card cmsgs">${msgs}</div>`
    + `<div class="crow"><input id="chin" class="in" maxlength="200" placeholder="${T('ch_ph')}"><button class="b" data-a="chsend">${T('ch_send')}</button></div></div></div>`; };

export const actions = {
  chsel: k => { cur = k; },
  chsend: () => { const el = document.getElementById('chin'), t = ((el && el.value) || '').trim(); if (!t) return;
    const B = box(); (B[cur] = B[cur] || []).push({ n: G.S.name, t, me: true, ts: now() }); }
};
