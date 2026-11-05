// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, SLOT_COST, NEW_B, BUILD_SEC } from '../data.js?v=7';
import { T, fmt } from '../i18n.js?v=7';
import { ic, icu } from '../icons.js?v=7';
import { G, now, dur, mm, busy, job, bMax, upCost, upSec, whCap, whUsed, saleCap } from '../state.js?v=7';
import * as factory from './factory.js?v=7';
import * as store from './store.js?v=7';

// Peta isometrik: SATU petak lahan (4x3 sel). 10 sel = slot bangunan (dibeli lalu dibangun), 2 sel = dekorasi.
// Kantor hanya pajangan (tidak bisa diketuk). Pabrik/Toko/Gudang di-upgrade dengan timer; tindakan Pabrik & Toko ada di dalam bangunan.
let sel = null;
export const selected = () => sel;
const OX = 157, OY = 150, DX = 46, DY = 23;
const P = (c, r) => [OX + (c - r) * DX, OY + (c + r) * DY];
const pts = a => a.map(p => p.join(',')).join(' ');
const dia = (c, r) => pts([P(c, r), P(c + 1, r), P(c + 1, r + 1), P(c, r + 1)]);
const cen = (c, r) => { const p = P(c, r); return [p[0], p[1] + DY]; };
const CELLS = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2]], DECOR = [[3, 0, 'trees'], [0, 2, 'pond']];
const IC = { factory: 'factory', store: 'store', office: 'office', warehouse: 'warehouse' };
const TH = [   // tier 1-4: berubah menurut level pemain
  { sky: ['#bfe7f6', '#fbf1d6'], g: '#a3d18b', g2: '#8fc276', ap: '#d8c8a2', pad: '#efe3c6', alt: '#e6d8b8', far: '#86b872', n: 0 },
  { sky: ['#a6d6ef', '#f6ecd3'], g: '#93cba2', g2: '#7fb890', ap: '#c9c5b6', pad: '#e7e3d7', alt: '#dedacb', far: '#9db9c6', n: 6 },
  { sky: ['#f2b98b', '#fde8c6'], g: '#82bbb2', g2: '#6ea69e', ap: '#b9c2c0', pad: '#e1e6e4', alt: '#d6dcda', far: '#8aa0b0', n: 9 },
  { sky: ['#262a66', '#e9807b'], g: '#5f9ca0', g2: '#4d8c91', ap: '#a9b6c1', pad: '#d9e0e6', alt: '#cdd5dc', far: '#4c5d7c', n: 12 }];
const COL = { office: { t: '#cfe3f1', l: '#9fc3dc', r: '#7fa7c4', a: '#e8f4fb', h: 38 }, factory: { t: '#b8bfc7', l: '#cfd4d9', r: '#a9b0b8', a: '#e4572e', h: 24 },
  store: { t: '#e4572e', l: '#f7ead0', r: '#e1d0ab', a: '#b3285b', h: 22 }, warehouse: { t: '#d3c4aa', l: '#bfae92', r: '#a39178', a: '#6b5a43', h: 20 } };

const pill = (cx, y, w, label, a, tone, prog) => {   // tombol aksi langsung di peta
  const col = { go: '#e8467c', sell: '#2fb56a', run: '#1b2026', off: '#2c3239' }[tone];
  return `<g ${a ? `class="tile" data-a="${a}" role="button" aria-label="${label}"` : 'pointer-events="none"'}><rect x="${cx - w / 2}" y="${y}" width="${w}" height="17" rx="3" fill="${col}" stroke="#000" stroke-opacity=".6"/>`
    + (prog != null ? `<rect x="${cx - w / 2 + 2}" y="${y + 14}" width="${(w - 4) * prog}" height="2" fill="#ff9ec0"/>` : '')
    + `<text x="${cx}" y="${y + 11}" text-anchor="middle" fill="#fff" style="font-size:8.5px;letter-spacing:.4px">${label}</text></g>`; };
const prog = j => j.st ? Math.min(1, (now() - j.st) / (j.end - j.st)) : null;
const quick = (t, i, cx, y) => { const S = G.S;
  if (busy('up', t)) return '';
  if (t === 'factory') { const j = S.jobs.find(j => j.k === 'make');
    if (j) return pill(cx, y, 74, mm(j.end - now()), null, 'run', prog(j));
    return pill(cx, y, 74, T('make').toUpperCase(), factory.canMake('shoes') ? 'qmake' : 'slot:' + i, factory.canMake('shoes') ? 'go' : 'off'); }
  if (t === 'store') { const j = S.jobs.find(j => j.k === 'sell');
    if (j) return pill(cx, y, 74, mm(j.end - now()), null, 'run', prog(j));
    const n = Math.min(Object.values(S.stock).reduce((a, v) => a + v, 0), saleCap());
    return store.canSell() ? pill(cx, y, 74, `${T('sell').toUpperCase()} ${n}`, 'qsell', 'sell') : pill(cx, y, 74, `${T('stock')} 0`, 'slot:' + i, 'off'); }
  return ''; };

const hang = (x, y, c) => `<g transform="translate(${x} ${y})" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M0 -3v-4a3.2 3.2 0 1 1 3.2 3.2"/><path d="M0 -3L-12 6h24z"/></g>`;
const emb = (t, cx, cy, h, b) => t === 'office' ? hang(cx, cy - h - b - 4, '#ff9ec0') : t === 'store' ? hang(cx, cy - h - b - 4, '#f6ead7')
  : t === 'factory' ? `<g transform="translate(${cx + 8} ${cy - h - 8})"><rect x="-6" y="-14" width="12" height="3" rx="1" fill="#f6ead7"/><rect x="-4.5" y="-11" width="9" height="9" fill="#e8467c"/><rect x="-6" y="-2" width="12" height="3" rx="1" fill="#f6ead7"/><path d="M-4.5 -8l9 3M-4.5 -4l9 3" stroke="#f6ead7" stroke-width=".8"/></g>` : '';
const bld = (t, lv, cx, cy) => {
  const c = COL[t], a = 32, b = 16, h = c.h + 7 * Math.min(lv, 5), up = G.S.jobs.find(j => j.k === 'up' && j.id === t);
  const R = (u, v, w, ht, f) => `<rect x="${u}" y="${v}" width="${w}" height="${ht}" fill="${f}"/>`;
  let l = '', r = '', roof = '';   // detail sisi kiri/kanan memakai koordinat lokal sisi (skew), atap memakai koordinat layar
  if (t === 'office') { const n = Math.max(1, Math.floor((h - 10) / 12));
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { l += R(4 + k * 10, -h + 6 + i * 12, 6, 7, c.a); r += R(4 + k * 10, -h + 6 + i * 12, 6, 7, c.a); }
    r += R(24, -10, 5, 10, '#b3285b'); roof = ''; }
  if (t === 'factory') { l += R(6, -16, 18, 16, c.a) + R(6, -11, 18, 1, '#fff') + R(6, -6, 18, 1, '#fff'); for (let k = 0; k < 3; k++) r += R(4 + k * 9, -h + 6, 6, 6, '#e8f4fb');
    roof = Array.from({ length: Math.min(lv, 3) }, (_, k) => `<rect x="${cx - 14 + k * 9}" y="${cy - h - 17 + k * 3}" width="6" height="15" fill="#7f868e"/><rect x="${cx - 14 + k * 9}" y="${cy - h - 17 + k * 3}" width="6" height="3" fill="${c.a}"/>`).join('')
      + (G.S.jobs.some(j => j.k === 'make') ? `<circle cx="${cx - 11}" cy="${cy - h - 26}" r="5" fill="#fff" opacity=".8"/><circle cx="${cx - 5}" cy="${cy - h - 35}" r="4" fill="#fff" opacity=".55"/>` : ''); }
  if (t === 'store') { for (let k = 0; k < 4; k++) l += R(k * 8, -h + 5, 8, 9, k % 2 ? '#fffaf2' : '#e4572e'); l += R(5, -12, 22, 8, '#bfe3ee'); r += R(10, -13, 10, 13, c.a) + R(4, -h + 8, 6, 6, '#bfe3ee'); }
  if (t === 'warehouse') { l += R(6, -18, 20, 18, c.a); for (let k = 1; k < 5; k++) l += R(6, -18 + k * 3.6, 20, .8, '#fff'); r += R(5, -h + 5, 22, 4, c.l); }
  return `<ellipse cx="${cx}" cy="${cy + 4}" rx="${a + 8}" ry="${b + 4}" fill="#0003"/>`
    + `<polygon points="${cx - a},${cy} ${cx},${cy + b} ${cx},${cy + b - h} ${cx - a},${cy - h}" fill="${c.l}"/><polygon points="${cx},${cy + b} ${cx + a},${cy} ${cx + a},${cy - h} ${cx},${cy + b - h}" fill="${c.r}"/>`
    + `<polygon points="${cx},${cy - b - h} ${cx + a},${cy - h} ${cx},${cy + b - h} ${cx - a},${cy - h}" fill="${c.t}"/>`
    + `<g transform="translate(${cx - a} ${cy}) matrix(1 .5 0 1 0 0)">${l}</g><g transform="translate(${cx} ${cy + b}) matrix(1 -.5 0 1 0 0)">${r}</g>` + roof + emb(t, cx, cy, h, b)
    + (up ? `<polygon points="${cx - a},${cy} ${cx},${cy + b} ${cx + a},${cy} ${cx + a},${cy - h} ${cx},${cy - b - h} ${cx - a},${cy - h}" fill="#fff" opacity=".55"/><rect x="${cx - 31}" y="${cy - h / 2 - 9}" width="62" height="18" rx="9" fill="#e4572e"/><image href="${icu('timer')}" x="${cx - 26}" y="${cy - h / 2 - 6}" width="12" height="12"/><text x="${cx - 11}" y="${cy - h / 2 + 4}" fill="#fff">${mm(up.end - now())}</text>` : '');
};

const tree = (x, y) => `<rect x="${x - 1.5}" y="${y}" width="3" height="8" fill="#7a5a3a"/><circle cx="${x}" cy="${y - 2}" r="9" fill="#4f9a55"/><circle cx="${x - 3}" cy="${y - 5}" r="4.5" fill="#6fb86a"/>`;
const deco = (k, x, y, t) => k === 'trees' ? tree(x - 16, y - 2) + tree(x + 12, y - 8) + tree(x + 14, y + 8)
  : `<ellipse cx="${x}" cy="${y}" rx="30" ry="15" fill="${t < 2 ? '#d9c9a3' : '#aab4bd'}"/><ellipse cx="${x}" cy="${y}" rx="25" ry="12" fill="#6ec1e4"/><ellipse cx="${x - 8}" cy="${y - 3}" rx="8" ry="3" fill="#fff" opacity=".5"/>` + (t < 2 ? '' : `<path d="M${x} ${y}v-15" stroke="#d9f3fd" stroke-width="3"/><circle cx="${x}" cy="${y - 17}" r="4" fill="#d9f3fd"/>`);
const skyline = (t, th) => { if (!th.n) return `<path d="M0 160Q70 118 140 142T290 130T360 148V162H0z" fill="${th.far}"/>`;
  let s = ''; const w = 360 / th.n;
  for (let i = 0; i < th.n; i++) { const h = 24 + (i * 37 % 41) + t * 9, x = i * w, wc = t > 2 ? '#ffd98a' : '#fff';
    s += `<rect x="${x + 1}" y="${160 - h}" width="${w - 2}" height="${h}" rx="2" fill="${th.far}" opacity="${i % 2 ? .78 : 1}"/>`;
    if (t > 1) for (let j = 0; j < h / 12 - 1; j++) s += `<rect x="${x + 5}" y="${152 - j * 12}" width="3" height="5" fill="${wc}" opacity=".75"/><rect x="${x + w - 9}" y="${152 - j * 12}" width="3" height="5" fill="${wc}" opacity=".75"/>`; }
  return s; };

const inv = () => { const S = G.S, ch = [...Object.keys(D.materials).filter(m => S.mat[m] >= 1).map(m => [D.materials[m].icon, T(m), Math.floor(S.mat[m])]),
    ...Object.keys(D.products).filter(k => S.stock[k]).map(k => [D.products[k].icon, T(k), S.stock[k]])];
  return ch.length ? `<div class="inv">${ch.map(([i, n, c]) => `<span class="ci">${ic(i)}<b>${c}</b><small>${n}</small></span>`).join('')}</div>` : ''; };
const guide = () => { const S = G.S, has = t => S.land.slots.some(x => x.t === t), mk = S.jobs.some(j => j.k === 'make'), sl = S.jobs.some(j => j.k === 'sell'),
    stock = Object.values(S.stock).reduce((a, n) => a + n, 0);
  const cons = S.jobs.some(j => j.k === 'up' && S.b[j.id] === 0);
  const k = cons ? 7 : !has('factory') ? 1 : !has('store') ? (S.made || stock ? 4 : mk ? 3 : 2) : S.sold ? 0 : stock ? 5 : sl ? 6 : mk ? 3 : 2;
  const c = k === 1 ? ' · ' + fmt(NEW_B.factory.cost) : k === 4 ? ' · ' + fmt(NEW_B.store.cost) : '';
  return k ? `<div class="card guide"><b>${T('step')}${k < 7 ? ` ${k}/6` : ''}</b><div>${T('g' + k)}${c}</div></div>` : ''; };

export const view = () => { const S = G.S, t = Math.min(4, S.level) - 1, th = TH[t], sl = S.land.slots;
  const A = P(0, 0), B = P(4, 0), C = P(4, 3), D2 = P(0, 3), ap = [[A[0], A[1] - 9], [B[0] + 13, B[1]], [C[0], C[1] + 9], [D2[0] - 13, D2[1]]];
  let bg = `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${th.sky[0]}"/><stop offset="1" stop-color="${th.sky[1]}"/></linearGradient><pattern id="gp" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.6" fill="${th.g2}"/><circle cx="18" cy="17" r="1.6" fill="${th.g2}"/></pattern></defs>`
    + `<rect width="360" height="380" fill="${th.g}"/><rect width="360" height="380" fill="url(#gp)"/><rect width="360" height="162" fill="url(#sk)"/>`
    + `<circle cx="304" cy="${t < 3 ? 40 : 76}" r="${t < 3 ? 16 : 22}" fill="${t < 3 ? '#fff2b8' : '#ffb36b'}" opacity=".9"/>` + skyline(t, th)
    + (t < 2 ? [[20, 196], [338, 196], [14, 336], [346, 350], [74, 352], [292, 362]].slice(0, t ? 3 : 6).map(p => tree(...p)).join('') : '')
    + `<polygon points="${pts([ap[3], ap[2], [ap[2][0], ap[2][1] + 8], [ap[3][0], ap[3][1] + 8]])}" fill="#0002"/><polygon points="${pts([ap[2], ap[1], [ap[1][0], ap[1][1] + 8], [ap[2][0], ap[2][1] + 8]])}" fill="#0003"/>`
    + `<polygon points="${pts(ap)}" fill="${th.ap}"/><polygon points="${pts([A, B, C, D2])}" fill="${th.pad}"/>`;
  const all = [...CELLS.map(([c, r], i) => ({ c, r, i })), ...DECOR.map(([c, r, k]) => ({ c, r, k }))].sort((x, y) => x.c + x.r - y.c - y.r || x.c - y.c);
  let g = '', ov = '';
  for (const e of all) { const [cx, cy] = cen(e.c, e.r), fill = (e.c + e.r) % 2 ? th.alt : th.pad;
    if (e.k) { g += `<polygon points="${dia(e.c, e.r)}" fill="${fill}"/>` + deco(e.k, cx, cy, t); continue; }
    const s = sl[e.i], aff = !s.own && S.money >= SLOT_COST[e.i], fixed = s.own && s.t === 'office';
    let inner = `<polygon points="${dia(e.c, e.r)}" fill="${fill}"/>`;
    if (!s.own) { inner += `<polygon points="${dia(e.c, e.r)}" fill="#1c1917" opacity=".16" stroke="${aff ? '#f2b84b' : '#6b6259'}" stroke-width="2" stroke-dasharray="6 5"/>`;
      ov += `<g pointer-events="none"><image href="${icu('lock')}" x="${cx - 10}" y="${cy - 22}" width="20" height="20"/><text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="#2b2420">${fmt(SLOT_COST[e.i])}</text></g>`; }
    else if (!s.t) { inner += `<polygon points="${dia(e.c, e.r)}" fill="none" stroke="#b3285b" stroke-width="2" stroke-dasharray="6 5"/>`;
      ov += `<g pointer-events="none"><circle cx="${cx}" cy="${cy - 4}" r="12" fill="#b3285b"/><path d="M${cx - 6} ${cy - 4}h12M${cx} ${cy - 10}v12" stroke="#fff" stroke-width="3" stroke-linecap="round"/><text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="#b3285b">${T('buildhere')}</text></g>`; }
    else { const lv = S.b[s.t]; inner += bld(s.t, lv, cx, cy);
      const hh = COL[s.t].h + 7 * Math.min(lv, 5);
      ov += `<g pointer-events="none"><rect x="${cx + 18}" y="${cy - hh - 10}" width="26" height="13" rx="3" fill="#0c0e11" stroke="#2c3239"/><text x="${cx + 31}" y="${cy - hh}" text-anchor="middle" fill="#ff9ec0" style="font-size:8px">Lv${Math.max(1, lv)}</text></g>` + quick(s.t, e.i, cx, cy - hh - 52); }
    if (sel === e.i) inner += `<polygon points="${dia(e.c, e.r)}" fill="none" stroke="#f2b84b" stroke-width="3.5"/>`;
    g += `<g class="tile"${fixed ? '' : ` data-a="slot:${e.i}" role="button" aria-label="${T(s.t || 'plot')} ${e.i + 1}"`}>${inner}</g>`; }
  return guide() + `<div class="card mapbar"><div class="row"><b>${ic('star')}Lv${S.level} · ${T('map_t' + (t + 1))}</b><span class="mute">${sl.filter(s => s.own).length}/${sl.length} ${T('plot')}</span></div>${sl.some(s => s.t === 'factory') ? `<div class="row mute" style="margin-top:4px"><span>${T('warehouse')} ${whUsed()}/${whCap()}</span><span>${T('machine')} ${Math.round(S.cond * 100)}%</span></div>` : ''}</div>`
    + `<svg class="mapsvg" viewBox="0 0 360 380" role="group" aria-label="${T('map')}">${bg}${g}${ov}</svg>`+inv(); };

const upCard = id => { const S = G.S, b = D.buildings[id], lv = S.b[id], top = lv >= bMax();
  return `<div class="card"><div class="row"><span>${ic(b.icon)}${T(id)} Lv${lv}/${bMax()}</span><button class="b" data-a="up:${id}" ${top || busy('up', id) || S.money < upCost(id) ? 'disabled' : ''}>${top ? T('max') : `${T('upgrade')} · ${fmt(upCost(id))} · ${mm(dur(upSec(id)))}`}</button></div><div class="mute row"><span>${T(b.fx)}</span></div>${job('up', id)}</div>`; };
const PANEL = { factory: () => upCard('factory') + factory.view(), store: () => upCard('store') + store.view(),
  warehouse: () => upCard('warehouse') + `<div class="card"><div class="row"><span>${T('warehouse')}</span><b>${whUsed()}/${whCap()}</b></div></div>` };

export const sheet = () => { if (sel === null) return '';
  const S = G.S, s = S.land.slots[sel]; let ti, body;
  if (!s.own) { const c = SLOT_COST[sel]; ti = `${ic('lock')}${T('plot')} ${sel + 1}`;
    body = `<div class="card"><div class="row"><span>${T('buyslot')}</span><b>${fmt(c)}</b></div><div class="row"><button class="b" data-a="buyslot" ${S.money < c ? 'disabled' : ''}>${T('buyslot')} · ${fmt(c)}</button></div></div>`; }
  else if (!s.t) { ti = `${ic('map')}${T('plot')} ${sel + 1}`;
    const has = t => S.land.slots.some(x => x.t === t), core = S.land.slots.some(x => x.t === 'factory') && has('store');
    const free = Object.entries(NEW_B).filter(([t]) => !has(t) && (t === 'factory' || t === 'store' || core));
    body = (free.map(([t, b]) => `<div class="card"><div class="row"><span>${ic(b.icon)}${T(t)}</span><button class="b" data-a="build:${t}" ${S.money < b.cost ? 'disabled' : ''}>${T('buildhere')} · ${fmt(b.cost)}</button></div><div class="mute">${T(b.fx)}</div></div>`).join('') || `<div class="card mute">${T('allbuilt')}</div>`)
      + `<div class="card mute">${T('soon')}: ${T('boutique')}, ${T('studio')}</div>`; }
  else { ti = `${ic(IC[s.t])}${T(s.t)} Lv${S.b[s.t]}`; body = (PANEL[s.t] || (() => ''))(); }
  return `<div class="shbg" data-a="close"></div><div class="sh" role="dialog"><div class="shh"><h2>${ti}</h2><button class="x" data-a="close" aria-label="${T('close')}">✕</button></div><div class="shb">${body}</div></div>`; };

export const actions = {
  slot: i => { sel = +i; },
  close: () => { sel = null; },
  buyslot: () => { const S = G.S, s = S.land.slots[sel]; if (!s || s.own || S.money < SLOT_COST[sel]) return; S.money -= SLOT_COST[sel]; s.own = true; },
  build: t => { const S = G.S, s = S.land.slots[sel];
    if (!s || !s.own || s.t || !NEW_B[t] || S.money < NEW_B[t].cost || S.land.slots.some(x => x.t === t)) return;
    S.money -= NEW_B[t].cost; s.t = t;
    if (BUILD_SEC[t]) { S.b[t] = 0; S.jobs.push({ k: 'up', id: t, st: now(), end: now() + dur(BUILD_SEC[t]) }); } else S.b[t] = S.b[t] || 1; },
  qmake: () => factory.actions.make('shoes'),
  qsell: () => { const id = Object.keys(D.products).find(k => (G.S.stock[k] || 0) > 0); if (id) store.actions.sell(id); }
};
