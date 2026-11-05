// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
import { D, BTN, SLOT_COST, NEW_B, BUILD_SEC } from '../data.js?v=14';
import { T, fmt } from '../i18n.js?v=14';
import { ic, icu } from '../icons.js?v=14';
import { G, itemDef, now, dur, mm, busy, job, bMax, upCost, upSec, whCap, whUsed, saleCap } from '../state.js?v=14';
import * as factory from './factory.js?v=14';
import * as depth from '../depth.js?v=14';
import * as store from './store.js?v=14';

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
const COL = { office: { t: '#f3e6f7', l: '#c9a6d6', r: '#a77fb9', a: '#ffd6ea', h: 38 }, factory: { t: '#d9d2e3', l: '#efe6f2', r: '#c4b6d3', a: '#e8467c', h: 24 },
  store: { t: '#ff6f9e', l: '#fff3e4', r: '#f0dcc2', a: '#b3285b', h: 22 }, warehouse: { t: '#e9d7b8', l: '#d4bd96', r: '#b99f78', a: '#7a4a6b', h: 20 } };

const chip = (cx, y, icon, label, tone, act, p) => {   // gelembung kecil: ikon + (timer/angka). Tanpa kata-kata
  const w = label ? 24 + label.length * 5.4 : 26, x = cx - w / 2, col = { run: '#2a1838', go: '#e8467c', sell: '#2fb56a', off: '#6b5f78' }[tone];
  return `<g ${act ? `class="tile" data-a="${act}" role="button"` : 'pointer-events="none"'}><rect x="${x}" y="${y}" width="${w}" height="19" rx="9.5" fill="${col}" stroke="#fff" stroke-opacity=".75"/>`
    + `<image href="${icu(icon)}" x="${x + 3}" y="${y + 2}" width="15" height="15"/>`
    + (label ? `<text x="${x + 20}" y="${y + 13}" fill="#fff" style="font-size:9px;font-weight:700">${label}</text>` : '')
    + (p != null ? `<rect x="${x + 4}" y="${y + 16}" width="${(w - 8) * p}" height="2" rx="1" fill="#ffc2da"/>` : '') + `</g>`; };
const fxOf = (b, cx, y) => { const t = now(), L = (G.S.fx || []).filter(e => e.b === b && t - e.t < 12000).slice(-2);   // hasil barang / uang, hilang sendiri
  return L.map((e, k) => { const a = t - e.t, yy = y - Math.min(a, 3000) / 3000 * 12 - k * 22, op = a > 9000 ? 1 - (a - 9000) / 3000 : 1;
    const lab = b === 'store' ? '+' + fmt(e.m) : '+' + e.n, icon = b === 'store' ? 'money' : itemDef(e.id).icon, w = 26 + lab.length * 5.6;
    return `<g pointer-events="none" opacity="${op}"><rect x="${cx - w / 2}" y="${yy}" width="${w}" height="19" rx="9.5" fill="${b === 'store' ? '#f2b84b' : '#fff'}" stroke="${b === 'store' ? '#b9770e' : '#e8467c'}" stroke-width="1.5"/><image href="${icu(icon)}" x="${cx - w / 2 + 3}" y="${yy + 2}" width="15" height="15"/><text x="${cx - w / 2 + 20}" y="${yy + 13}" fill="#2b2420" style="font-size:9.5px;font-weight:800">${lab}</text></g>`; }).join(''); };
const prog = j => j.st ? Math.min(1, (now() - j.st) / (j.end - j.st)) : null;
const quick = (t, i, cx, y) => { const S = G.S;
  if (busy('up', t)) return '';
  if (t === 'factory') { const js = S.jobs.filter(j => j.k === 'make');
    if (js.length) { const j = js.reduce((a, b) => (a.end < b.end ? a : b)); return chip(cx, y, itemDef(j.id).icon, mm(j.end - now()) + (js.length > 1 ? ' ×' + js.length : ''), 'run', 'slot:' + i, prog(j)); }
    const ok = factory.canMake('shoes'); return chip(cx, y, ok ? 'shoes' : 'factory', '', ok ? 'go' : 'off', ok ? 'qmake' : 'slot:' + i); }
  if (t === 'store') { const j = S.jobs.find(j => j.k === 'sell');
    if (j) return chip(cx, y, 'money', mm(j.end - now()), 'run', 'slot:' + i, prog(j));
    return store.canSell() ? chip(cx, y, 'money', '', 'sell', 'qsell') : ''; }
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
  if (t === 'store') { for (let k = 0; k < 4; k++) l += R(k * 8, -h + 5, 8, 9, k % 2 ? '#fffaf2' : '#e4572e'); l += R(5, -12, 22, 8, '#bfe3ee') + `<circle cx="16" cy="-10.6" r="1.4" fill="#f6ead7"/><path d="M16 -9.2l-3.4 5.2h6.8z" fill="#e8467c"/>`; r += R(10, -13, 10, 13, c.a) + R(4, -h + 8, 6, 6, '#bfe3ee'); }
  if (t === 'warehouse') { l += R(6, -18, 20, 18, c.a); for (let k = 1; k < 5; k++) l += R(6, -18 + k * 3.6, 20, .8, '#fff'); r += R(5, -h + 5, 22, 4, c.l); }
  if (t === 'warehouse') roof = [['#e8467c', -13], ['#5b8def', 0], ['#2ec4b6', 13]].map(([c, d]) => `<rect x="${cx + d - 6}" y="${cy - h - 7}" width="12" height="8" fill="${c}"/><ellipse cx="${cx + d}" cy="${cy - h + 1}" rx="6" ry="3" fill="${c}"/><ellipse cx="${cx + d}" cy="${cy - h - 7}" rx="6" ry="3" fill="#fff" opacity=".5"/><ellipse cx="${cx + d}" cy="${cy - h - 7}" rx="2" ry="1" fill="#0004"/>`).join('');   // gulungan kain di atap
  const sh = `<polygon filter="url(#sh)" points="${cx - a},${cy} ${cx},${cy + b} ${cx + a + 16 + h * .5},${cy + 5 + h * .12} ${cx + 22 + h * .5},${cy - b + 5}" fill="#1a0f2e" opacity=".42"/><ellipse cx="${cx}" cy="${cy + 6}" rx="${a + 2}" ry="${b - 1}" fill="#000" opacity=".3" filter="url(#sh)"/>`;
  return sh
    + `<polygon points="${cx - a},${cy} ${cx},${cy + b} ${cx},${cy + b - h} ${cx - a},${cy - h}" fill="${c.l}"/><polygon points="${cx},${cy + b} ${cx + a},${cy} ${cx + a},${cy - h} ${cx},${cy + b - h}" fill="${c.r}"/>`
    + `<polygon points="${cx},${cy - b - h} ${cx + a},${cy - h} ${cx},${cy + b - h} ${cx - a},${cy - h}" fill="${c.t}"/>`
    + `<polygon points="${cx - a},${cy} ${cx},${cy + b} ${cx},${cy + b - h} ${cx - a},${cy - h}" fill="url(#fl)"/><polygon points="${cx},${cy + b} ${cx + a},${cy} ${cx + a},${cy - h} ${cx},${cy + b - h}" fill="url(#fr)"/><polygon points="${cx},${cy - b - h} ${cx + a},${cy - h} ${cx},${cy + b - h} ${cx - a},${cy - h}" fill="url(#ft)"/>`
    + `<g transform="translate(${cx - a} ${cy}) matrix(1 .5 0 1 0 0)">${l}</g><g transform="translate(${cx} ${cy + b}) matrix(1 -.5 0 1 0 0)">${r}</g>` + `<polyline points="${cx - a},${cy - h} ${cx},${cy - b - h} ${cx + a},${cy - h}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linejoin="round"/><polyline points="${cx},${cy + b - h} ${cx},${cy + b}" stroke="#fff" stroke-opacity=".25" stroke-width="1" fill="none"/><polygon points="${cx - a},${cy} ${cx},${cy + b} ${cx + a},${cy} ${cx},${cy - b}" fill="url(#ao)" opacity=".55"/>` + roof + emb(t, cx, cy, h, b)
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


const pillD = (t, i) => { const S = G.S; if (busy('up', t)) return null;
  if (t === 'factory') { const j = S.jobs.find(j => j.k === 'make'); if (j) return [mm(j.end - now()), null, 'run', prog(j)]; const ok = factory.canMake('shoes'); return [T('make').toUpperCase(), ok ? 'qmake' : 'slot:' + i, ok ? 'go' : 'off', null]; }
  if (t === 'store') { const j = S.jobs.find(j => j.k === 'sell'); if (j) return [mm(j.end - now()), null, 'run', prog(j)];
    const n = Math.min(Object.values(S.stock).reduce((a, v) => a + v, 0), saleCap()); return store.canSell() ? [`${T('sell').toUpperCase()} ${n}`, 'qsell', 'sell', null] : [`${T('stock')} 0`, 'slot:' + i, 'off', null]; }
  return null; };
const inv = () => { const S = G.S, ch = [...Object.keys(D.materials).filter(m => S.mat[m] >= 1).map(m => [D.materials[m].icon, T(m), Math.floor(S.mat[m])]),
    ...Object.keys(D.products).filter(k => S.stock[k]).map(k => [D.products[k].icon, T(k), S.stock[k]])];
  return ch.length ? `<div class="inv">${ch.map(([i, n, c]) => `<span class="ci">${ic(i)}<b>${c}</b><small>${n}</small></span>`).join('')}</div>` : ''; };
const guide = () => { const S = G.S, has = t => S.land.slots.some(x => x.t === t), mk = S.jobs.some(j => j.k === 'make'), sl = S.jobs.some(j => j.k === 'sell'),
    stock = Object.values(S.stock).reduce((a, n) => a + n, 0);
  const cons = S.jobs.some(j => j.k === 'up' && S.b[j.id] === 0);
  const k = cons ? 7 : !has('factory') ? 1 : !has('store') ? (S.made || stock ? 4 : mk ? 3 : 2) : S.sold ? 0 : stock ? 5 : sl ? 6 : mk ? 3 : 2;
  const c = k === 1 ? ' · ' + fmt(NEW_B.factory.cost) : k === 4 ? ' · ' + fmt(NEW_B.store.cost) : '';
  return k ? `<div class="card guide"><b>${T('step')}${k < 7 ? ` ${k}/6` : ''}</b><div>${T('g' + k)}${c}</div></div>` : ''; };

export const view = () => { const S = G.S, hr = new Date(now()).getHours(), night = hr >= 18 || hr < 5, t = Math.min(4, S.level) - 1, th = TH[t], sl = S.land.slots;
  const A = P(0, 0), B = P(4, 0), C = P(4, 3), D2 = P(0, 3), ap = [[A[0], A[1] - 9], [B[0] + 13, B[1]], [C[0], C[1] + 9], [D2[0] - 13, D2[1]]];
  const lp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k], Z = [A, B, C, D2], nx = i => (i + 1) % 4,
    bk = ap.map((p, i) => [p[0] + [0, 36, 0, -36][i], p[1] + [-20, 0, 20, 0][i]]), mid = ap.map((p, i) => lp(p, Z[i], .5)),
    path = 'M' + mid.map(p => p.join(',')).join('L') + 'Z', rpath = 'M' + [mid[0], mid[3], mid[2], mid[1]].map(p => p.join(',')).join('L') + 'Z',
    slab = `<polygon points="${pts([bk[3], bk[2], [bk[2][0], bk[2][1] + 16], [bk[3][0], bk[3][1] + 16]])}" fill="#7a6a54"/><polygon points="${pts([bk[2], bk[1], [bk[1][0], bk[1][1] + 16], [bk[2][0], bk[2][1] + 16]])}" fill="#5f5240"/><polygon points="${pts(bk)}" fill="${th.g}"/><polygon points="${pts(bk)}" fill="url(#gp)"/>`,
    trees = [[1, .3], [1, .7], [2, .2], [2, .5], [2, .8], [3, .3], [3, .7], [0, .35], [0, .7]].slice(0, t > 1 ? 6 : 9).map(([i, k]) => { const q = lp(lp(bk[i], bk[nx(i)], k), lp(ap[i], ap[nx(i)], k), .5); return tree(q[0], q[1] - 2); }).join(''),
    lamps = [0, 1, 2, 3].flatMap(i => [.3, .7].map(k => lp(mid[i], mid[nx(i)], k))),
    lampSvg = lamps.map(p => `<g transform="translate(${p[0]} ${p[1]})"><rect x="-.8" y="-12" width="1.6" height="12" fill="#4b4452"/><circle cy="-13" r="2.6" fill="#ffe9a8"/></g>`).join(''),
    glow = night ? lamps.map(p => `<circle cx="${p[0]}" cy="${p[1] - 13}" r="16" fill="#ffe9a8" opacity=".55" filter="url(#gl2)"/><ellipse cx="${p[0]}" cy="${p[1]}" rx="18" ry="8" fill="#ffd98a" opacity=".22" filter="url(#gl2)"/>`).join('') : '',
    car = (c, pa, d, b) => `<g><rect x="-6" y="-3" width="12" height="6" rx="2" fill="${c}"/><rect x="-2" y="-5" width="6" height="3" rx="1" fill="#fff" opacity=".75"/><animateMotion dur="${d}s" begin="-${b}s" repeatCount="indefinite" path="${pa}"/></g>`,
    cars = ['#e8467c', '#2ec4b6', '#f2b84b', '#5b8def'].slice(0, 1 + t).map((c, i) => car(c, i % 2 ? rpath : path, 24 + i * 6, i * 7)).join(''),
    cloud = (y, d, b) => `<g opacity=".9" fill="${night ? '#8d97c4' : '#fff'}"><ellipse rx="22" ry="7"/><ellipse cx="12" cy="-4" rx="14" ry="6"/><animateTransform attributeName="transform" type="translate" from="-60 ${y}" to="420 ${y}" dur="${d}s" begin="-${b}s" repeatCount="indefinite"/></g>`,
    wave = x => `<path d="M${x} 330q6-4 12 0t12 0" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"><animateTransform attributeName="transform" type="translate" values="0 0;8 0;0 0" dur="${4 + x % 3}s" repeatCount="indefinite"/></path>`,
    stars = night ? [[30, 20], [80, 42], [140, 14], [210, 34], [260, 18], [330, 50], [60, 72]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="1.2" fill="#fff"/>`).join('') : '',
    tint = `<rect width="360" height="380" fill="url(#sun)" pointer-events="none" opacity="${night ? 0 : 1}"/><rect width="360" height="380" fill="url(#vg)" pointer-events="none"/>` + (night ? `<rect width="360" height="380" fill="#1a2250" opacity=".28" pointer-events="none"/>` + glow : '');
  let bg = `<defs><filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="3.2"/></filter><filter id="gl2" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter><linearGradient id="fl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#10081c" stop-opacity=".28"/></linearGradient><linearGradient id="fr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#10081c" stop-opacity=".05"/><stop offset="1" stop-color="#10081c" stop-opacity=".5"/></linearGradient><linearGradient id="ft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity=".05"/></linearGradient><linearGradient id="ao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".35" stop-color="#000" stop-opacity="0"/></linearGradient><radialGradient id="vg" cx=".5" cy=".55" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#1a0f2e" stop-opacity=".38"/></radialGradient><radialGradient id="sun" cx=".85" cy=".05" r="1"><stop offset="0" stop-color="#fff6d6" stop-opacity=".55"/><stop offset=".5" stop-color="#fff6d6" stop-opacity="0"/></radialGradient><linearGradient id="wt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#27406b' : '#6fb8d6'}"/><stop offset="1" stop-color="${night ? '#142544' : '#3d83ab'}"/></linearGradient><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? '#111a3d' : th.sky[0]}"/><stop offset="1" stop-color="${night ? '#3b3f78' : th.sky[1]}"/></linearGradient><pattern id="gp" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="1.6" fill="${th.g2}"/><circle cx="18" cy="17" r="1.6" fill="${th.g2}"/></pattern></defs>`
    + `<rect width="360" height="380" fill="url(#wt)"/><rect width="360" height="162" fill="url(#sk)"/>${stars}${cloud(28, 80, 10)}${cloud(62, 115, 60)}${[20, 70, 250, 300, 40, 280].map(wave).join('')}`
    + `<circle cx="304" cy="${t < 3 ? 40 : 76}" r="${t < 3 ? 16 : 22}" fill="${night ? '#e8edff' : t < 3 ? '#fff2b8' : '#ffb36b'}" opacity=".9"/>` + skyline(t, th)
    + slab + trees
    + `<polygon points="${pts([ap[3], ap[2], [ap[2][0], ap[2][1] + 8], [ap[3][0], ap[3][1] + 8]])}" fill="#0002"/><polygon points="${pts([ap[2], ap[1], [ap[1][0], ap[1][1] + 8], [ap[2][0], ap[2][1] + 8]])}" fill="#0003"/>`
    + `<polygon points="${pts(ap)}" fill="${th.ap}"/><polygon points="${pts(mid)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-dasharray="7 6"/><polygon points="${pts([A, B, C, D2])}" fill="${th.pad}"/>` + lampSvg + cars;
  const all = [...CELLS.map(([c, r], i) => ({ c, r, i })), ...DECOR.map(([c, r, k]) => ({ c, r, k }))].sort((x, y) => x.c + x.r - y.c - y.r || x.c - y.c);
  let g = '', ov = '';
  for (const e of all) { const [cx, cy] = cen(e.c, e.r), fill = (e.c + e.r) % 2 ? th.alt : th.pad;
    if (e.k) { g += `<polygon points="${dia(e.c, e.r)}" fill="${fill}"/>` + deco(e.k, cx, cy, t); continue; }
    const s = sl[e.i], aff = !s.own && S.btn >= BTN.plot, fixed = s.own && s.t === 'office';
    let inner = `<polygon points="${dia(e.c, e.r)}" fill="${fill}"/>`;
    if (!s.own) { inner += `<polygon points="${dia(e.c, e.r)}" fill="#1c1917" opacity=".16" stroke="${aff ? '#f2b84b' : '#6b6259'}" stroke-width="2" stroke-dasharray="6 5"/>`;
      ov += `<g pointer-events="none"><image href="${icu('lock')}" x="${cx - 11}" y="${cy - 20}" width="22" height="22"/>${aff ? `<circle cx="${cx + 12}" cy="${cy - 18}" r="4.5" fill="#f2b84b" stroke="#b9770e"/>` : ''}</g>`; }
    else if (!s.t) { inner += `<polygon points="${dia(e.c, e.r)}" fill="none" stroke="#b3285b" stroke-width="2" stroke-dasharray="6 5"/>`;
      ov += `<g pointer-events="none"><circle cx="${cx}" cy="${cy - 2}" r="12" fill="#b3285b" stroke="#fff" stroke-opacity=".8"/><path d="M${cx - 6} ${cy - 2}h12M${cx} ${cy - 8}v12" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`; }
    else { const lv = S.b[s.t]; inner += bld(s.t, lv, cx, cy);
      const hh = COL[s.t].h + 7 * Math.min(lv, 5);
      const dx = { factory: -20, store: 22 }[s.t] || 0;
      ov += quick(s.t, e.i, cx + dx, cy - hh - 42) + fxOf(s.t, cx + dx, cy - hh - 66); }
    if (sel === e.i) inner += `<polygon points="${dia(e.c, e.r)}" fill="none" stroke="#f2b84b" stroke-width="3.5"/>`;
    g += `<g class="tile"${fixed ? '' : ` data-a="slot:${e.i}" role="button" aria-label="${T(s.t || 'plot')} ${e.i + 1}"`}>${inner}</g>`; }
  return `<svg class="mapsvg" viewBox="0 0 360 380" role="group" aria-label="${T('map')}">${bg}${g}${tint}${ov}</svg>`; };

const upCard = id => { const S = G.S, b = D.buildings[id], lv = S.b[id], top = lv >= bMax();
  return `<div class="card"><div class="row"><span>${ic(b.icon)}${T(id)} Lv${lv}/${bMax()}</span><button class="b" data-a="up:${id}" ${top || busy('up', id) || S.money < upCost(id) ? 'disabled' : ''}>${top ? T('max') : `${T('upgrade')} · ${fmt(upCost(id))} · ${mm(dur(upSec(id)))}`}</button></div><div class="mute row"><span>${T(b.fx)}</span></div>${job('up', id)}</div>`; };
const PANEL = { factory: () => upCard('factory') + factory.view(), store: () => upCard('store') + store.view() + depth.salesPanel(),
  warehouse: () => upCard('warehouse') + `<div class="card"><div class="row"><span>${T('warehouse')}</span><b>${whUsed()}/${whCap()}</b></div></div>` };

export const sheet = () => { if (sel === null) return '';
  const S = G.S, s = S.land.slots[sel]; let ti, body;
  if (!s.own) { const c = BTN.plot; ti = `${ic('lock')}${T('plot')} ${sel + 1}`;
    body = `<div class="card"><div class="row"><span>${T('buyslot')}</span><b>${c} ${T('btn')}</b></div><div class="row"><button class="b" data-a="buyslot" ${S.btn < c ? 'disabled' : ''}>${T('buyslot')} · ${c} ${T('btn')}</button></div></div>`; }
  else if (!s.t) { ti = `${ic('map')}${T('plot')} ${sel + 1}`;
    const has = t => S.land.slots.some(x => x.t === t), core = S.land.slots.some(x => x.t === 'factory') && has('store');
    const free = Object.entries(NEW_B).filter(([t]) => !has(t) && (t === 'factory' || t === 'store' || core));
    body = (free.map(([t, b]) => `<div class="card"><div class="row"><span>${ic(b.icon)}${T(t)}</span><button class="b" data-a="build:${t}" ${S.money < b.cost ? 'disabled' : ''}>${T('buildhere')} · ${fmt(b.cost)}</button></div><div class="mute">${T(b.fx)}</div></div>`).join('') || `<div class="card mute">${T('allbuilt')}</div>`)
      + `<div class="card mute">${T('soon')}: ${T('boutique')}, ${T('studio')}</div>`; }
  else { ti = `${ic(IC[s.t])}${T(s.t)} Lv${S.b[s.t]}`; body = (PANEL[s.t] || (() => ''))(); }
  return `<div class="shbg" data-a="close"></div><div class="sh" role="dialog"><div class="shh"><h2>${ti}</h2><button class="x" data-a="close" aria-label="${T('close')}">✕</button></div><div class="shb">${guide()}${body}</div></div>`; };

export const actions = {
  slot: i => { sel = +i; },
  close: () => { sel = null; },
  buyslot: () => { const S = G.S, s = S.land.slots[sel]; if (!s || s.own || S.btn < BTN.plot) return; S.btn -= BTN.plot; s.own = true; },
  build: t => { const S = G.S, s = S.land.slots[sel];
    if (!s || !s.own || s.t || !NEW_B[t] || S.money < NEW_B[t].cost || S.land.slots.some(x => x.t === t)) return;
    S.money -= NEW_B[t].cost; s.t = t;
    if (BUILD_SEC[t]) { S.b[t] = 0; S.jobs.push({ k: 'up', id: t, st: now(), end: now() + dur(BUILD_SEC[t]) }); } else S.b[t] = S.b[t] || 1; },
  qmake: () => factory.actions.make('shoes'),
  qsell: () => { const id = Object.keys(D.products).find(k => (G.S.stock[k] || 0) > 0); if (id) store.actions.sell(id); }
};
