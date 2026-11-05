// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// Peta kota isometrik (gaya Sim Companies): 4x4 blok, jalan, mobil, siang/malam, geser & cubit untuk zoom.
// 10 slot lahan game (S.land.slots) menempati 10 blok; 6 blok sisanya dekorasi (taman, runway, pepohonan).
import { G, now, busy, mm } from './state.js?v=26';

const N = 17, DX = 32, DY = 16, OX = 540, OY = 110;
const SLOT_POS = [[1, 1], [2, 1], [1, 2], [2, 2], [0, 1], [3, 1], [1, 0], [2, 0], [1, 3], [2, 3]];   // indeks slot -> blok (bx,by)
const DECOR = { '0,0': 'park', '3,0': 'plaza', '0,2': 'trees', '3,2': 'park', '0,3': 'park', '3,3': 'trees' };
const MOODS = { day: [1, 1, 1], night: [.42, .48, .8] };
let mood = 'day', seed = 7;
const rnd = () => (seed = seed * 16807 % 2147483647) / 2147483647;
const hx = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const k = (h, f = 1) => 'rgb(' + hx(h).map((v, i) => Math.min(255, Math.round(v * f * MOODS[mood][i]))).join() + ')';
const P = (c, r, z = 0) => [OX + (c - r) * DX, OY + (c + r) * DY - z];
const f1 = n => Math.round(n * 10) / 10;
const pts = a => a.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
const poly = (a, fill, x = '') => `<polygon points="${pts(a)}" fill="${fill}" ${x}/>`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
function box(c, r, w, d, h, col, o = {}) {
  const z = o.z || 0, A = P(c, r, z + h), B = P(c + w, r, z + h), C = P(c + w, r + d, z + h), D = P(c, r + d, z + h), a0 = P(c, r + d, z), b0 = P(c + w, r + d, z), c0 = P(c + w, r, z);
  return { s: poly([a0, b0, C, D], k(col, o.l || .86)) + poly([b0, c0, B, C], k(col, o.r || .66)) + poly([A, B, C, D], k(col, o.t || 1.1)) + `<polyline points="${pts([D, C, B])}" fill="none" stroke="#fff" stroke-opacity=".35"/>`, L: { a: a0, b: b0, h }, R: { a: b0, b: c0, h } };
}
function wn(f, nu, nv, ins, zr, fill) {
  let s = '';
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const sp = zr[1] - zr[0], u0 = (i + ins) / nu, u1 = (i + 1 - ins) / nu, v0 = zr[0] + sp * (j + ins) / nv, v1 = zr[0] + sp * (j + 1 - ins) / nv, fl = typeof fill === 'function' ? fill(i, j) : fill;
    if (!fl) continue;
    const p = lerp(f.a, f.b, u0), q = lerp(f.a, f.b, u1);
    s += poly([[p[0], p[1] - v0 * f.h], [q[0], q[1] - v0 * f.h], [q[0], q[1] - v1 * f.h], [p[0], p[1] - v1 * f.h]], fl);
  }
  return s;
}
const glass = () => mood === 'night' ? (rnd() > .45 ? '#ffd98a' : '#27324d') : (rnd() > .5 ? '#a9d6ea' : '#8fc3dd');
const hanger = (x, y, s, col) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})" fill="none" stroke="${col}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M0 -4V-7a3 3 0 1 1 3 3"/><path d="M0 -4L-14 7h28z"/></g>`;
const tree = (c, r, z = 3, sc = 1, pink = 0) => {
  const [x, y] = P(c, r, z), g = pink ? ['#e58fb2', '#f2a5c3', '#f7bfd5', '#fbd3e2'] : ['#4f9a52', '#5fae5e', '#7cc36d', '#8fd27c'];
  return `<ellipse cx="${f1(x)}" cy="${f1(y + 2)}" rx="${11 * sc}" ry="${5 * sc}" fill="#000" opacity=".22"/><rect x="${f1(x - 1.6 * sc)}" y="${f1(y - 9 * sc)}" width="${3.2 * sc}" height="${10 * sc}" fill="${k('#6a4b3a')}"/><circle cx="${f1(x)}" cy="${f1(y - 17 * sc)}" r="${10 * sc}" fill="${k(g[0])}"/><circle cx="${f1(x - 5 * sc)}" cy="${f1(y - 12 * sc)}" r="${7.5 * sc}" fill="${k(g[1])}"/><circle cx="${f1(x + 5 * sc)}" cy="${f1(y - 13 * sc)}" r="${7 * sc}" fill="${k(g[2])}"/><circle cx="${f1(x - 2 * sc)}" cy="${f1(y - 21 * sc)}" r="${5 * sc}" fill="${k(g[3])}" opacity=".8"/>`;
};
const lamp = (c, r) => {
  const a = P(c, r, 3), b = P(c, r, 24);
  return `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${k('#3a3446')}" stroke-width="2"/><circle cx="${f1(b[0])}" cy="${f1(b[1])}" r="2.6" fill="#ffe9a8"/>` + (mood === 'night' ? `<circle cx="${f1(b[0])}" cy="${f1(b[1] + 6)}" r="26" fill="url(#cglow)"/>` : '');
};
const quad = (a, b, c, d, z, f, x = '') => poly([P(a, b, z), P(c, b, z), P(c, d, z), P(a, d, z)], f, x);

// ---- bangunan (jejak 2x2 di tengah blok 3x3). lv = level bangunan ----
const DRAW = {
  park(c0, r0) {
    const p = P(c0 + 1.5, r0 + 1.5, 3.2);
    return { s: `<ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="42" ry="21" fill="${k('#e9e1ee')}"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="37" ry="18" fill="${k('#5fb3d4')}"/><ellipse cx="${f1(p[0] - 8)}" cy="${f1(p[1] - 4)}" rx="14" ry="4" fill="#fff" opacity=".35"/>` + tree(c0 + .5, r0 + .5, 3.2, 1, 1) + tree(c0 + 2.5, r0 + .6) + tree(c0 + 2.4, r0 + 2.5, 3.2, 1.1, 1) + tree(c0 + .6, r0 + 2.4), h: 0 };
  },
  trees(c0, r0) {
    let s = '';
    [[.5, .5], [1.5, .4], [2.5, .6], [.4, 1.5], [2.6, 1.5], [.6, 2.5], [1.5, 2.6], [2.5, 2.4]].forEach(([a, b], i) => s += tree(c0 + a, r0 + b, 3.2, 1 + (i % 3) * .08, i % 4 === 1));
    return { s, h: 0 };
  },
  plaza(c0, r0) {
    let s = quad(c0 + .25, r0 + 1.05, c0 + 2.75, r0 + 1.95, 3.3, k('#f4cde0')) + quad(c0 + .25, r0 + 1.45, c0 + 2.75, r0 + 1.55, 3.4, '#ffffff99');
    for (let i = 0; i < 6; i++) { const p = P(c0 + .45 + i * .45, r0 + 1.05, 3.6), q = P(c0 + .45 + i * .45, r0 + 1.95, 3.6); s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="1.6" fill="#fff"/><circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="1.6" fill="#fff"/>`; }
    const w = box(c0 + 2.7, r0 + 1.05, .14, .9, 26, '#e8467c'), p = P(c0 + 2.77, r0 + 1.5, 26);
    return { s: s + tree(c0 + .5, r0 + .5, 3.2, 1, 1) + tree(c0 + 2.5, r0 + .5) + tree(c0 + .5, r0 + 2.5) + w.s + hanger(p[0] - 3, p[1] - 14, .9, '#fff'), h: 0 };
  },
  farm(c0, r0, lv) {
    let s = '';
    for (let j = 0; j < 6; j++) {
      const a = P(c0 + .3, r0 + .35 + j * .4, 3.2), b = P(c0 + 1.9, r0 + .35 + j * .4, 3.2);
      s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${k(j % 2 ? '#6aa24d' : '#7bb35a')}" stroke-width="8" stroke-linecap="round"/>`;
      for (let i = 0; i < 5; i++) { const p = lerp(a, b, (i + .5) / 5); s += `<circle cx="${f1(p[0])}" cy="${f1(p[1] - 4)}" r="3.4" fill="${k('#ffffff')}"/>`; }
    }
    const br = box(c0 + 1.9, r0 + 1.7, .7, .7, 13 + Math.min(lv, 5), '#c94c63');
    return { s: s + br.s + poly([P(c0 + 1.9, r0 + 1.7, 13 + Math.min(lv, 5)), P(c0 + 2.6, r0 + 1.7, 13 + Math.min(lv, 5)), P(c0 + 2.25, r0 + 1.7, 20 + Math.min(lv, 5))], k('#8e2f45')), h: 22 };
  },
  factory(c0, r0, lv) {
    const c = c0 + .5, r = r0 + .5, H = 24 + 3 * Math.min(lv, 5), b = box(c, r, 2, 2, H, '#d6d0e4');
    let s = b.s + wn(b.L, 2, 1, .12, [0, .5], i => i ? null : k('#e8467c')) + wn(b.L, 5, 1, .18, [.62, .86], () => glass()) + wn(b.R, 5, 1, .18, [.62, .86], () => glass());
    for (let i = 0; i < Math.min(3, 1 + lv); i++) { const t = box(c + .1 + i * .62, r + .15, .5, 1.7, 8, '#e8e3f1', { z: H }); s += t.s + wn(t.R, 1, 1, .15, [.2, .8], k('#bfe6f5')); }
    s += box(c + 1.55, r + .15, .3, .3, 30, '#8a8696', { z: H }).s + box(c + 1.55, r + .15, .3, .3, 4, '#e8467c', { z: H + 26 }).s;
    const sm = P(c + 1.7, r + .3, H + 32);
    if (G.S.jobs.some(j => j.k === 'make')) s += [0, 1, 2].map(i => `<circle class="csmk" style="animation-delay:${i}s" cx="${f1(sm[0] + i * 3)}" cy="${f1(sm[1])}" r="${5 + i}" fill="#fff" opacity=".7"/>`).join('');
    return { s, h: H + 32 };
  },
  store(c0, r0, lv) {
    const c = c0 + .5, r = r0 + .5, H = 30 + 3 * Math.min(lv, 5), b = box(c, r, 2, 2, H, '#f6ead7');
    let s = b.s + wn(b.L, 2, 1, .1, [.06, .46], k('#bfe6f5')) + wn(b.R, 3, 1, .2, [.4, .8], () => glass());
    const n = 8;
    for (let i = 0; i < n; i++) { const a = lerp(b.L.a, b.L.b, i / n), e = lerp(b.L.a, b.L.b, (i + 1) / n); s += poly([[a[0], a[1] - H * .66], [e[0], e[1] - H * .66], [e[0] - 8, e[1] + 4 - H * .5], [a[0] - 8, a[1] + 4 - H * .5]], k(i % 2 ? '#f6ead7' : '#e8467c')); }
    const p = P(c + 1, r + 1, H);
    s += box(c + 1.2, r + .3, .4, .4, 5, '#b9b5c3', { z: H }).s + `<line x1="${f1(p[0])}" y1="${f1(p[1] - 9)}" x2="${f1(p[0])}" y2="${f1(p[1])}" stroke="${k('#8a8696')}" stroke-width="2"/><circle cx="${f1(p[0])}" cy="${f1(p[1] - 24)}" r="15" fill="${k('#e8467c')}" stroke="#fff" stroke-width="1.5"/>` + hanger(p[0], p[1] - 24, .9, '#fff');
    return { s, h: H + 30 };
  },
  warehouse(c0, r0, lv) {
    const c = c0 + .5, r = r0 + .5, H = 20 + 2 * Math.min(lv, 5), b = box(c, r, 2, 2, H, '#e7d3b0');
    let s = b.s + wn(b.L, 3, 1, .12, [0, .6], k('#9a6a85'));
    for (let j = 1; j < 6; j++) s += wn(b.L, 3, 1, .12, [j * .1, j * .1 + .008], '#ffffff55');
    s += [['#e8467c', 0], ['#5b8def', .42], ['#2ec4b6', .84]].map(([col, d]) => {
      const p = P(c + .4 + d, r + .8 + d * .4, H);
      return `<rect x="${f1(p[0] - 8)}" y="${f1(p[1] - 11)}" width="16" height="11" fill="${k(col)}"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1])}" rx="8" ry="4" fill="${k(col, .85)}"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1] - 11)}" rx="8" ry="4" fill="${k(col, 1.2)}"/><ellipse cx="${f1(p[0])}" cy="${f1(p[1] - 11)}" rx="2.6" ry="1.3" fill="#0005"/>`;
    }).join('');
    return { s, h: H + 14 };
  },
  office(c0, r0, lv) {
    const TH = 70 + 8 * Math.min(lv, 5), pd = box(c0 + .2, r0 + .2, 2.6, 2.6, 10, '#d9c2e0'), b = box(c0 + .7, r0 + .7, 1.6, 1.6, TH, '#86a9c4', { z: 10 }), tp = box(c0 + .9, r0 + .9, 1.2, 1.2, 8, '#6c8fab', { z: 10 + TH });
    const p = P(c0 + 1.5, r0 + 1.5, 18 + TH);
    const s = pd.s + wn(pd.L, 6, 1, .15, [.1, .8], () => glass()) + b.s + wn(b.L, 5, Math.round(TH / 10), .16, [.03, .97], () => glass()) + wn(b.R, 5, Math.round(TH / 10), .16, [.03, .97], () => glass()) + tp.s
      + `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(p[0])}" y2="${f1(p[1] - 26)}" stroke="${k('#8a8696')}" stroke-width="2"/>` + hanger(p[0], p[1] - 30, 1.2, k('#e8467c'));
    return { s, h: 18 + TH + 36 };
  },
  site(c0, r0) {   // lokasi konstruksi (bangunan baru sedang dibangun)
    const b = box(c0 + .5, r0 + .5, 2, 2, 8, '#d8cfc0'), z0 = 8, z1 = 40;
    let s = b.s;
    [[.5, .5], [2.5, .5], [2.5, 2.5], [.5, 2.5]].forEach(([a, d]) => { const p = P(c0 + a, r0 + d, z0), q = P(c0 + a, r0 + d, z1); s += `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="#e8a33d" stroke-width="2.4"/>`; });
    s += poly([P(c0 + .5, r0 + .5, z1), P(c0 + 2.5, r0 + .5, z1), P(c0 + 2.5, r0 + 2.5, z1), P(c0 + .5, r0 + 2.5, z1)], 'none', 'stroke="#e8a33d" stroke-width="2"') + poly([P(c0 + .5, r0 + 2.5, z0), P(c0 + 2.5, r0 + 2.5, z0), P(c0 + 2.5, r0 + 2.5, z1), P(c0 + .5, r0 + 2.5, z1)], '#e8a33d33', 'stroke="#e8a33d" stroke-width="1.2"') + poly([P(c0 + 2.5, r0 + 2.5, z0), P(c0 + 2.5, r0 + .5, z0), P(c0 + 2.5, r0 + .5, z1), P(c0 + 2.5, r0 + 2.5, z1)], '#e8a33d22', 'stroke="#e8a33d" stroke-width="1.2"');
    return { s, h: z1 + 4 };
  },
  lock(c0, r0) {
    return { s: poly([P(c0 + .3, r0 + .3, 3.2), P(c0 + 2.7, r0 + .3, 3.2), P(c0 + 2.7, r0 + 2.7, 3.2), P(c0 + .3, r0 + 2.7, 3.2)], 'none', `stroke="${k('#ffffff', .9)}" stroke-opacity=".55" stroke-dasharray="6 5" stroke-width="1.6"`), h: 4 };
  },
  empty(c0, r0) {
    return { s: poly([P(c0 + .3, r0 + .3, 3.2), P(c0 + 2.7, r0 + .3, 3.2), P(c0 + 2.7, r0 + 2.7, 3.2), P(c0 + .3, r0 + 2.7, 3.2)], k('#e8467c', .35), 'stroke="#e8467c" stroke-width="2" stroke-dasharray="6 5" stroke-opacity=".9"'), h: 4 };
  }
};

const carCols = ['#e8467c', '#5b8def', '#f2b84b', '#2ec4b6', '#f6ead7', '#7a4bd6', '#e4572e', '#4f5d75'];
let cars = [];
const carSVG = (ax, col) => { const w = ax ? .2 : .5, d = ax ? .5 : .2, b = box(-w / 2, -d / 2, w, d, 5, col), t = box(-w / 2 + (ax ? 0 : .1), -d / 2 + (ax ? .1 : 0), ax ? w : w - .2, ax ? d - .2 : d, 4, '#2b3a52', { z: 5 }); return b.s + t.s; };

function ground(items) {
  const g = [], ob = [], q = -.7, Q = N + .7, th = 18, a = P(q, q), b = P(Q, q), c = P(Q, Q), d = P(q, Q);
  g.push(poly([d, c, [c[0], c[1] + th], [d[0], d[1] + th]], k('#7b5f6f', .9)) + poly([c, b, [b[0], b[1] + th], [c[0], c[1] + th]], k('#5b4455')) + poly([a, b, c, d], k('#9ccb7e')) + poly([P(0, 0), P(N, 0), P(N, N), P(0, N)], k('#4b4759')));
  const lane = k('#f3e3a6'), ln = (p, q2, x) => `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q2[0])}" y2="${f1(q2[1])}" ${x}/>`;
  for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) {
    const R = 4 * j + .5, s0 = 4 * i + 1, s1 = 4 * i + 4;
    g.push(ln(P(s0, R), P(s1, R), `stroke="${lane}" stroke-width="2" stroke-dasharray="10 8"`) + ln(P(R, s0), P(R, s1), `stroke="${lane}" stroke-width="2" stroke-dasharray="10 8"`));
    for (let t = 0; t < 4; t++) for (const u of [s0 + .05 + t * .1, s1 - .1 - t * .1]) g.push(poly([P(u, R - .4), P(u + .05, R - .4), P(u + .05, R + .4), P(u, R + .4)], '#fff', 'opacity=".75"') + poly([P(R - .4, u), P(R - .4, u + .05), P(R + .4, u + .05), P(R + .4, u)], '#fff', 'opacity=".75"'));
  }
  items.forEach(it => {
    const { bx, by } = it, c0 = 4 * bx + 1, r0 = 4 * by + 1, sl = box(c0, r0, 3, 3, 3, '#d9d2dd', { t: 1, l: .82, r: .6 });
    g.push(sl.s + poly([P(c0 + .14, r0 + .14, 3.1), P(c0 + 2.86, r0 + .14, 3.1), P(c0 + 2.86, r0 + 2.86, 3.1), P(c0 + .14, r0 + 2.86, 3.1)], k(it.green ? '#9ccb7e' : '#cfc7d6')));
    const o = DRAW[it.kind](c0, r0, it.lv || 1), cen = P(c0 + 1.5, r0 + 1.5);
    it.cx = cen[0]; it.top = cen[1] - o.h;
    const inner = o.s + lamp(c0 + .1, r0 + 2.9) + lamp(c0 + 2.9, r0 + .1);
    ob.push({ k: c0 + r0 + 3, s: it.act ? `<g class="cbld" data-a="${it.act}" role="button" aria-label="${it.label}">${inner}</g>` : `<g>${inner}</g>` });
  });
  for (let i = 0; i < 8; i++) { const t = 2 * i + 1; [[-.4, t], [N + .4, t], [t, -.4], [t, N + .4]].forEach(([cc, rr], n) => ob.push({ k: cc + rr, s: tree(cc, rr, 0, .9, (i + n) % 3 === 0) })); }
  ob.sort((x, y) => x.k - y.k);
  return g.join('') + '<g id="ccars"></g>' + ob.map(o => o.s).join('');
}

// ---- kamera: geser & cubit ----
const cam = { x: 0, y: 0, s: .85 };
let inited = false, items = [], moved = 0, pd = 0, suppress = false, lastT = 0;
const ptr = new Map();
const ap = () => { const g = document.getElementById('ccam'); if (g) g.setAttribute('transform', `translate(${f1(cam.x)} ${f1(cam.y)}) scale(${cam.s})`); };
function center(el) { const W = el.clientWidth, H = el.clientHeight; if (!W) return false; cam.s = Math.max(.5, Math.min(1, W / 760)); cam.x = W / 2 - OX * cam.s; cam.y = H / 2 - (OY + N * DY * .8) * cam.s; ap(); return true; }
function zoom(el, f, cx, cy) { const s = Math.max(.4, Math.min(1.8, cam.s * f)), r = s / cam.s; cam.x = cx - (cx - cam.x) * r; cam.y = cy - (cy - cam.y) * r; cam.s = s; ap(); }
function bind(el) {
  el._bound = true;
  el.addEventListener('pointerdown', e => { if (e.target.closest('.cz')) return; ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; pd = ptr.size > 1 ? Math.hypot(...[...ptr.values()].reduce((a, b) => [a[0] - b[0], a[1] - b[1]])) : 0; });
  addEventListener('pointermove', e => {
    if (!ptr.has(e.pointerId)) return;
    const o = ptr.get(e.pointerId), n = [e.clientX, e.clientY]; ptr.set(e.pointerId, n);
    if (ptr.size === 1) { cam.x += n[0] - o[0]; cam.y += n[1] - o[1]; moved += Math.abs(n[0] - o[0]) + Math.abs(n[1] - o[1]); ap(); }
    else if (ptr.size === 2) { const v = [...ptr.values()], d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), rc = el.getBoundingClientRect(); if (pd) zoom(el, d / pd, (v[0][0] + v[1][0]) / 2 - rc.left, (v[0][1] + v[1][1]) / 2 - rc.top); pd = d; moved += 9; }
  });
  const up = e => { if (ptr.delete(e.pointerId) && moved > 6) suppress = true; pd = 0; };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  el.addEventListener('click', e => { if (suppress) { suppress = false; e.stopPropagation(); e.preventDefault(); return; } const z = e.target.closest('[data-cz]'); if (z) { const v = z.dataset.cz; v === 'home' ? center(el) : zoom(el, +v, el.clientWidth / 2, el.clientHeight / 2); } }, true);
  el.addEventListener('wheel', e => { e.preventDefault(); const rc = el.getBoundingClientRect(); zoom(el, e.deltaY < 0 ? 1.1 : .9, e.clientX - rc.left, e.clientY - rc.top); }, { passive: false });
  if (!matchMedia('(prefers-reduced-motion:reduce)').matches) requestAnimationFrame(loop);
}
function loop(t) {
  const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
  if (!document.hidden) cars.forEach((c, n) => { c.pos += c.sp * dt * 1.6; if (c.pos > N) c.pos = 0; if (c.pos < 0) c.pos = N;
    const R = 4 * c.road + (c.lane ? .72 : .28), cc = c.ax ? R : c.pos, rr = c.ax ? c.pos : R, el = document.getElementById('car' + n);
    if (el) el.setAttribute('transform', `translate(${f1((cc - rr) * DX)} ${f1((cc + rr) * DY)})`); });
  requestAnimationFrame(loop);
}

// ---- pasang ke elemen #city. ctx = { chip, quick, fxOf } dari map.js ----
export function mount(el, ctx) {
  const S = G.S, hr = new Date(now()).getHours(), night = (S.pref || {}).map === 'night' || ((S.pref || {}).map !== 'day' && (hr >= 18 || hr < 5)), sl = S.land.slots;
  const key = [night ? 1 : 0, ...sl.map(s => (s.own ? 1 : 0) + (s.t || '-') + (S.b[s.t] || 0)), ...S.jobs.filter(j => j.k === 'up').map(j => j.id)].join('|');
  if (el._k !== key) {
    el._k = key; mood = night ? 'night' : 'day'; seed = 7;
    items = [];
    sl.forEach((s, i) => {
      const [bx, by] = SLOT_POS[i], t = s.t, up = t && S.jobs.find(j => j.k === 'up' && j.id === t), lv = t ? S.b[t] || 0 : 0;
      let kind, act = 'slot:' + i;
      if (!s.own) kind = 'lock'; else if (!t) kind = 'empty'; else if (up && lv === 0) kind = 'site'; else kind = t;
      if (t === 'office') act = 'tab:office';
      items.push({ bx, by, kind, i, t, act, lv: Math.max(1, lv), green: kind === 'farm', label: t || 'plot' });
    });
    Object.entries(DECOR).forEach(([p, kind]) => { const [bx, by] = p.split(',').map(Number); items.push({ bx, by, kind, green: true }); });
    cars = carCols.map((col, n) => { const ax = n % 2, road = [1, 2, 3, 0, 4, 2, 3, 1][n], lane = n % 4 < 2 ? 0 : 1; return { ax, road, lane, pos: rnd() * N, sp: (.5 + rnd() * .5) * (lane ? -1 : 1), col }; });
    const gs = ground(items), cg = cars.map((c, n) => `<g id="car${n}">${carSVG(c.ax, c.col)}</g>`).join('');
    el.innerHTML = `<svg id="csvg" role="group" aria-label="Peta kota"><defs><radialGradient id="cglow"><stop offset="0" stop-color="#ffd98a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient></defs><g id="ccam">${gs.replace('<g id="ccars"></g>', `<g id="ccars">${cg}</g>`)}<g id="cdyn"></g></g></svg><div class="cz"><button data-cz="1.25" aria-label="Zoom in">+</button><button data-cz="0.8" aria-label="Zoom out">−</button><button data-cz="home" aria-label="Center">⌂</button></div>`;
    el.classList.toggle('night', night);
    if (!inited) inited = center(el); else ap();
    if (!el._bound) bind(el);
  } else if (!inited) inited = center(el);
  // lapisan dinamis (tiap detik): timer, tombol cepat, efek hasil
  let d = '';
  items.forEach(it => {
    if (it.i === undefined) return;
    const y = it.top - 26, s = sl[it.i];
    if (!s.own) d += ctx.chip(it.cx, y + 6, 'lock', '', 'off', 'slot:' + it.i);
    else if (!s.t) d += ctx.chip(it.cx, y + 6, 'upgrade', '', 'go', 'slot:' + it.i);
    else {
      const up = S.jobs.find(j => j.k === 'up' && j.id === s.t);
      if (up) d += ctx.chip(it.cx, y, 'timer', mm(up.end - now()), 'run', 'slot:' + it.i);
      else if (s.t !== 'office') d += ctx.quick(s.t, it.i, it.cx, y) + ctx.fxOf(s.t, it.cx, y - 24);
    }
  });
  const dyn = document.getElementById('cdyn'); if (dyn && dyn._h !== d) { dyn._h = d; dyn.innerHTML = d; }
}
