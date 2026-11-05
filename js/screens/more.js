// (c) 2026 FashionGame. Menu samping: Pencapaian, Perpustakaan (resep), Tentang.
import { D } from '../data.js?v=16';
import { T, fmt } from '../i18n.js?v=16';
import { ic } from '../icons.js?v=16';
import { ART } from '../art.js?v=16';
import { G } from '../state.js?v=16';

let sub = 'ach';
const ACH = [['first', 'Penjualan pertama', 'First sale', S => S.sold >= 1], ['s100', '100 unit terjual', '100 units sold', S => S.sold >= 100], ['s500', '500 unit terjual', '500 units sold', S => S.sold >= 500],
  ['lv3', 'Capai Level 3', 'Reach Level 3', S => S.level >= 3], ['lv4', 'Capai Level 4', 'Reach Level 4', S => S.level >= 4], ['rep50', 'Reputasi 50', 'Reputation 50', S => S.rep >= 50],
  ['team', 'Tim 5 pekerja', 'Team of 5', S => S.wk.length >= 5], ['rich', 'Kas $10.000', 'Cash $10,000', S => S.money >= 10000], ['ct5', '5 kontrak selesai', '5 contracts done', S => (S.dp.cdone || 0) >= 5], ['free', 'Bebas pinjaman', 'Debt free', S => S.sold >= 10 && S.loan <= 0]];
const lg = (a, b) => G.S.lang === 'id' ? a : b;
const P = {
  ach: () => { const S = G.S, n = ACH.filter(a => a[3](S)).length;
    return `<div class="card"><h2>${ic('star')}${T('ach')} ${n}/${ACH.length}</h2><div class="bar"><i style="width:${n / ACH.length * 100}%"></i></div></div>` + ACH.map(a => `<div class="card ${a[3](S) ? '' : 'mute'}"><div class="row"><span>${a[3](S) ? '★' : '☆'} ${lg(a[1], a[2])}</span><b>${a[3](S) ? '✓' : '–'}</b></div></div>`).join(''); },
  lib: () => Object.entries(D.products).map(([k, p]) => `<div class="card" data-a="item:${k}" style="cursor:pointer"><div class="row"><span class="lib">${ART[k]}<b>${T(k)}</b></span><span class="mute">Lv${p.lvl} · ${fmt(p.base)}</span></div><div class="mute">${T('recipe')}: ${Object.entries(p.recipe).map(([m, n]) => n + '× ' + T(m)).join(', ')} → ${p.batch} ${T('unit')}</div></div>`).join('')
    + Object.entries(D.materials).map(([k, m]) => `<div class="card" data-a="item:${k}" style="cursor:pointer"><div class="row"><span class="lib">${ART[k]}<b>${T(k)}</b></span><span class="mute">${fmt(m.price)}</span></div><div class="mute">${T('usedin')}: ${Object.entries(D.products).filter(([, p]) => p.recipe[k]).map(([x]) => T(x)).join(', ')}</div></div>`).join(''),
  about: () => `<div class="card"><h2>FashionGame v8</h2><div class="mute">${lg('Simulasi pabrik fashion: beli bahan di bursa, produksi di Pabrik, jual lewat Toko, Online, atau Grosir. Jaga reputasi, kualitas, dan kas.', 'Fashion factory sim: buy materials on the exchange, produce in the Factory, sell via Store, Online or Wholesale. Mind reputation, quality and cash.')}</div></div>`
};
export const view = () => `<div class="tabs">${[['ach', 'star'], ['lib', 'research'], ['about', 'office']].map(([k, i]) => `<button class="chip ${k === sub ? 'on' : ''}" data-a="msub2:${k}">${ic(i)}<span>${T(k)}</span></button>`).join('')}</div>` + P[sub]();
export const actions = { msub2: k => { sub = k; } };
