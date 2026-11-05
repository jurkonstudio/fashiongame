// (c) 2026 FashionGame. All rights reserved. Original work; see /LICENSE.
// Peta 3D WebGL. Three.js dimuat dari CDN (versi dipin). Jika gagal dimuat / WebGL tidak ada, map.js memakai peta SVG.
// Semua model low-poly & tekstur dibuat prosedural di sini (tanpa file gambar/model eksternal).
const URL3 = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
let THREE = null, ok = false, S3 = null;
export const hooks = { pick: () => {} };
export const ready = () => ok;
(async () => { try { THREE = await import(URL3); ok = true; } catch (e) { console.warn('3D off', e); } })();

const CELLS = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2], [2, 2], [3, 2]], DECOR = [[3, 0, 'trees'], [0, 2, 'pond']];
const pos = (c, r) => [(c - 1.5) * 2, (r - 1) * 2];
const SKY = [['#9fd8f2', '#fbf1d6'], ['#8cc9ea', '#f6ecd3'], ['#e7a070', '#fde8c6'], ['#262a66', '#e9807b']], NSKY = ['#0b1230', '#3b3f78'];
const GRD = ['#a3d18b', '#93cba2', '#82bbb2', '#5f9ca0'], PAD = ['#efe3c6', '#e7e3d7', '#e1e6e4', '#d9e0e6'], ALT = ['#e6d8b8', '#dedacb', '#d6dcda', '#cdd5dc'];
const HG = { office: [3, .55], factory: [1.1, .15], store: [1.1, .2], warehouse: [.9, .18] };
const hOf = (t, lv) => HG[t][0] + HG[t][1] * Math.min(Math.max(lv, 1), 5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- tekstur prosedural ----------
const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const tx = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t; };
const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const grassCv = col => cv(256, 256, g => { g.fillStyle = col; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = rnd(i) > .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,40,0,.09)'; g.fillRect(rnd(i + 1e3) * 256, rnd(i + 2e3) * 256, 2 + rnd(i + 3e3) * 5, 2 + rnd(i + 4e3) * 5); } });
const roadCv = () => cv(256, 64, g => { g.fillStyle = '#3b3f46'; g.fillRect(0, 0, 256, 64);
  for (let i = 0; i < 500; i++) { g.fillStyle = rnd(i) > .5 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.12)'; g.fillRect(rnd(i + 9) * 256, rnd(i + 99) * 64, 2, 2); }
  g.fillStyle = '#f1e7c9'; g.fillRect(16, 30, 96, 4); g.fillRect(144, 30, 96, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 2, 256, 2); g.fillRect(0, 60, 256, 2); });
const SP = { office: ['#7fa7c4', '#1d3550', 4, 12, .5], factory: ['#c9cfd6', '#d6ecf6', 3, 2, .3], store: ['#f4e6c8', '#aee0ee', 3, 2, .6] }, FAC = {};
const facade = k => FAC[k] || (FAC[k] = (() => { const W = 256;
  if (k === 'warehouse') return { m: cv(W, W, g => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#a89877' : '#bcab8c'; g.fillRect(i * 16, 0, 16, W); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(i * 16, 0, 2, W); } }), e: cv(8, 8, g => { g.fillStyle = '#000'; g.fillRect(0, 0, 8, 8); }) };
  const [fr, wn, cs, rs, p] = SP[k], cw = W / cs, ch = W / rs, lit = (r, c) => rnd(r * 13 + c * 7 + k.length) < p, box = (r, c) => [c * cw + cw * .14, r * ch + ch * .16, cw * .72, ch * .66];
  return { m: cv(W, W, g => { g.fillStyle = fr; g.fillRect(0, 0, W, W);
      for (let r = 0; r < rs; r++) for (let c = 0; c < cs; c++) { const [x, y, w, h] = box(r, c), gr = g.createLinearGradient(x, y, x + w, y + h);
        gr.addColorStop(0, lit(r, c) ? '#ffe9b0' : wn); gr.addColorStop(1, lit(r, c) ? '#f4c36a' : '#0d1d30'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, w, 2); } }),
    e: cv(W, W, g => { g.fillStyle = '#000'; g.fillRect(0, 0, W, W); g.fillStyle = '#ffd98a'; for (let r = 0; r < rs; r++) for (let c = 0; c < cs; c++) if (lit(r, c)) g.fillRect(...box(r, c)); }) }; })());
const AWN = () => cv(64, 16, g => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fffaf2' : '#e4572e'; g.fillRect(i * 8, 0, 8, 16); } });

// ---------- material & geometri ----------
const WM = new Set();
const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true, ...o });
const fmat = (k, rx, ry) => { const f = facade(k), m = new THREE.MeshStandardMaterial({ map: tx(f.m, rx, ry), emissiveMap: tx(f.e, rx, ry), emissive: 0xffd98a, emissiveIntensity: S3.night ? 1.4 : 0, roughness: k === 'office' ? .25 : .8, metalness: k === 'office' ? .35 : .05 }); WM.add(m); return m; };
const bx = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); o.castShadow = o.receiveShadow = true; return o; };
const cyl = (r1, r2, h, m, x, y, z, n = 8) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, n), m); o.position.set(x, y + h / 2, z); o.castShadow = o.receiveShadow = true; return o; };
const prism = (w, hh, L, saw, m, x, y, z) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(saw ? w / 2 : 0, hh); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(-L / 2, 0, 0); g.computeVertexNormals();
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
const dispose = o => o.traverse(n => { if (n.geometry) n.geometry.dispose(); [].concat(n.material || []).forEach(m => { WM.delete(m); ['map', 'emissiveMap'].forEach(k => m[k] && m[k].dispose()); m.dispose(); }); });

// ---------- model bangunan (low-poly) ----------
const MK = {
  office(lv) { const h = hOf('office', lv), g = new THREE.Group(), s = fmat('office', 1, h / 3), r = std('#cfe3f1');
    g.add(bx(1.5, h, 1.5, [s, s, r, r, s, s]), bx(1, .4, 1, r, 0, h), cyl(.03, .03, .9, std('#555'), 0, h + .4, 0, 6));
    const L = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshStandardMaterial({ color: '#f00', emissive: '#f33', emissiveIntensity: 2 })); L.position.set(0, h + 1.35, 0); g.add(L);
    g.add(bx(.9, .28, .08, std('#e8467c', { emissive: '#e8467c', emissiveIntensity: .6 }), 0, h + .02, .52)); return g; },
  factory(lv) { const h = hOf('factory', lv), g = new THREE.Group(), w = fmat('factory', 2, h / 1.1), r = std('#9aa1a9'), th = Math.min(lv, 3) + 1;
    g.add(bx(1.8, h, 1.6, [w, w, r, r, w, w]));
    for (let k = 0; k < 3; k++) g.add(prism(.56, .42, 1.8, true, std('#b8bfc7'), 0, h, -.55 + k * .55));
    const ch = 1 + .2 * th; g.add(cyl(.12, .16, ch, std('#8a5a4a'), .6, h, -.5), cyl(.17, .17, .08, std('#e8467c'), .6, h + ch - .1, -.5));
    g.add(bx(.7, .6, .05, std('#2a2f35'), -.3, 0, .81), bx(.7, .06, .06, std('#e4572e', { emissive: '#e4572e', emissiveIntensity: .5 }), -.3, .62, .82));
    g.userData.chim = new THREE.Vector3(.6, h + ch, -.5); return g; },
  store(lv) { const h = hOf('store', lv), g = new THREE.Group(), s = fmat('store', 1, h / 1.1), r = std('#e4572e');
    g.add(bx(1.7, h, 1.5, [s, s, r, r, s, s]));
    const a = new THREE.Mesh(new THREE.BoxGeometry(1.7, .06, .5), new THREE.MeshStandardMaterial({ map: tx(AWN(), 1, 1), roughness: .9 })); a.position.set(0, .8, 1); a.rotation.x = .35; a.castShadow = true; g.add(a);
    g.add(bx(1, .32, .1, std('#b3285b', { emissive: '#b3285b', emissiveIntensity: .6 }), 0, h, .55), bx(.5, .5, .05, std('#2a2f35'), .45, 0, .76)); return g; },
  warehouse(lv) { const h = hOf('warehouse', lv), g = new THREE.Group(), s = fmat('warehouse', 2, h / 1.2), r = std('#8f7f66');
    g.add(bx(1.8, h, 1.7, [s, s, r, r, s, s]), prism(1.8, .45, 1.8, false, std('#6b5a43'), 0, h, 0), bx(.9, .65, .05, std('#6b5a43'), 0, 0, .86));
    for (let k = 0; k < 4; k++) g.add(bx(.9, .02, .06, std('#c9b99a'), 0, .12 + k * .15, .87)); return g; }
};
const tree = (x, z, s = 1) => { const g = new THREE.Group(), c = ['#4f9a55', '#5fae62', '#6fb86a'];
  g.add(cyl(.06 * s, .09 * s, .4 * s, std('#7a5a3a'), 0, 0, 0, 6));
  for (let i = 0; i < 3; i++) { const o = new THREE.Mesh(new THREE.ConeGeometry((.46 - i * .1) * s, .7 * s, 6), std(c[i])); o.position.y = (.55 + i * .35) * s; o.castShadow = true; g.add(o); }
  g.position.set(x, 0, z); return g; };

// ---------- scene ----------
function ensure() {
  if (S3) return S3;
  const wrap = document.createElement('div'); wrap.className = 'm3';
  const ren = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); ren.shadowMap.enabled = true; ren.shadowMap.type = THREE.PCFSoftShadowMap;
  ren.toneMapping = THREE.ACESFilmicToneMapping; ren.toneMappingExposure = 1; ren.outputColorSpace = THREE.SRGBColorSpace;
  const cvs = ren.domElement; wrap.appendChild(cvs); const ov = document.createElement('div'); ov.className = 'm3o'; wrap.appendChild(ov);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 1, 160);
  S3 = { wrap, ren, scene, cam, ov, tier: -1, night: null, info: null, sig: [], groups: [], tiles: [], lab: [], lastLab: [], anc: [], pick: [], dyaw: 0, smoke: [], hgt: [], tt: 0, fr: 0, w: 0 };
  scene.fog = new THREE.Fog('#bfe7f6', 50, 120);
  S3.hemi = new THREE.HemisphereLight(0xdff1ff, 0x8a7a66, 1.1); scene.add(S3.hemi);
  const sun = S3.sun = new THREE.DirectionalLight(0xfff1d6, 2.6); sun.position.set(10, 16, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 50 }); sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04; scene.add(sun, sun.target);
  // air (facet low-poly, beranimasi)
  const wg = new THREE.PlaneGeometry(140, 140, 48, 48); wg.rotateX(-Math.PI / 2); S3.wy = Float32Array.from(wg.attributes.position.array.filter((_, i) => i % 3 === 1));
  const water = S3.water = new THREE.Mesh(wg, new THREE.MeshStandardMaterial({ color: '#3d83ab', roughness: .25, metalness: .15, flatShading: true })); water.position.y = -.6; water.receiveShadow = true; scene.add(water);
  // pulau
  S3.grass = new THREE.MeshStandardMaterial({ roughness: .95 }); const dirt = std('#7a6a54'), dirt2 = std('#5f5240');
  const top = new THREE.Mesh(new THREE.BoxGeometry(11.6, .5, 9.2), [dirt, dirt, S3.grass, dirt, dirt, dirt]); top.position.y = -.25; top.receiveShadow = top.castShadow = true;
  const bot = new THREE.Mesh(new THREE.BoxGeometry(10.8, .9, 8.4), dirt2); bot.position.y = -.95; bot.castShadow = true; scene.add(top, bot);
  // jalan + marka
  [[0, -3.6, 9.8, 0], [0, 3.6, 9.8, 0], [-4.6, 0, 7.8, 1], [4.6, 0, 7.8, 1]].forEach(([x, z, L, rot]) => { const m = bx(L, .06, .7, new THREE.MeshStandardMaterial({ map: tx(roadCv(), L / 3.3, 1), roughness: .9 })); m.position.set(x, .03, z); m.rotation.y = rot ? Math.PI / 2 : 0; m.receiveShadow = true; scene.add(m); });
  // petak
  const mkTile = (c, r, i) => { const [x, z] = pos(c, r), m = new THREE.Mesh(new THREE.BoxGeometry(1.84, .12, 1.84), new THREE.MeshStandardMaterial({ roughness: .9 }));
    m.position.set(x, .08, z); m.receiveShadow = true; scene.add(m); return m; };
  CELLS.forEach(([c, r], i) => { const t = mkTile(c, r, i); t.userData.slot = i; S3.tiles[i] = t; S3.anc[i] = new THREE.Vector3(...[pos(c, r)[0], 1.2, pos(c, r)[1]]); });
  S3.decor = DECOR.map(([c, r, k]) => { const t = mkTile(c, r), [x, z] = pos(c, r), g = new THREE.Group(); g.position.set(x, .14, z);
    if (k === 'trees') [[-.5, -.4, 1], [.45, -.2, 1.15], [.1, .5, .9]].forEach(([a, b, s]) => g.add(tree(a, b, s)));
    else { g.add(cyl(.82, .82, .06, std('#d9c9a3'), 0, 0, 0, 20), cyl(.7, .7, .08, new THREE.MeshStandardMaterial({ color: '#6ec1e4', roughness: .08, metalness: .3 }), 0, .02, 0, 20)); S3.fount = cyl(.05, .05, .5, std('#d9f3fd'), 0, .1, 0, 6); S3.fount.visible = false; g.add(S3.fount); }
    scene.add(g); return t; });
  // pohon tepi, lampu, mobil
  [[-5.3, -3.6], [-5.3, -1.2], [-5.3, 1.4], [-5.3, 3.5], [5.3, -3.2], [5.3, -.8], [5.3, 1.6], [5.3, 3.6], [-3, -4.25], [0, -4.25], [3, -4.25], [-2.4, 4.25], [1, 4.25], [3.6, 4.25]].forEach(([x, z], i) => scene.add(tree(x, z, .9 + rnd(i) * .35)));
  S3.lampMat = new THREE.MeshStandardMaterial({ color: '#ffe9a8', emissive: '#ffe9a8', emissiveIntensity: 0 }); S3.pl = [];
  [[-4.2, -3.2], [-1.4, -3.2], [1.4, -3.2], [4.2, -3.2], [-4.2, 3.2], [-1.4, 3.2], [1.4, 3.2], [4.2, 3.2]].forEach(([x, z], i) => { scene.add(cyl(.025, .03, .75, std('#4b4452'), x, .05, z, 6)); const b = new THREE.Mesh(new THREE.SphereGeometry(.08, 8, 6), S3.lampMat); b.position.set(x, .86, z); scene.add(b);
    if (i % 2 === 0) { const p = new THREE.PointLight(0xffd98a, 9, 7, 2); p.position.set(x, 1, z); p.visible = false; scene.add(p); S3.pl.push(p); } });
  S3.cars = ['#e8467c', '#2ec4b6', '#f2b84b', '#5b8def'].map((c, i) => { const g = new THREE.Group(); g.add(bx(.5, .16, .26, std(c), 0, .06, 0), bx(.26, .13, .22, std('#dfe9f2'), -.03, .22, 0)); g.userData.u = i * .27; scene.add(g); return g; });
  // awan
  S3.cmat = new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: .35, flatShading: true, roughness: 1 });
  S3.clouds = [0, 1, 2, 3].map(i => { const g = new THREE.Group(); [[0, 0, 0, 1.8], [1.4, -.2, .3, 1.3], [-1.3, -.2, -.2, 1.4]].forEach(([x, y, z, s]) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), S3.cmat); m.scale.y = .55; m.position.set(x, y, z); g.add(m); });
    g.position.set(-45 + i * 30, 13 + i % 2 * 3, -18 + i * 7); scene.add(g); return g; });
  S3.sky = document.createElement('canvas'); S3.sky.width = 2; S3.sky.height = 256; scene.background = new THREE.CanvasTexture(S3.sky); scene.background.colorSpace = THREE.SRGBColorSpace;
  S3.sk = new THREE.Group(); scene.add(S3.sk);
  // input: geser horizontal = putar kamera, ketuk = pilih petak
  let d = null; const ray = new THREE.Raycaster(), v = new THREE.Vector2();
  cvs.style.touchAction = 'pan-y';
  cvs.addEventListener('pointerdown', e => { d = { x: e.clientX, y: e.clientY, yaw: S3.dyaw, mv: false }; try { cvs.setPointerCapture(e.pointerId); } catch (_) { } });
  cvs.addEventListener('pointermove', e => { if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 8) d.mv = true; if (d.mv) S3.dyaw = clamp(d.yaw - dx * .006, -.8, .8); });
  cvs.addEventListener('pointercancel', () => { d = null; });
  cvs.addEventListener('pointerup', e => { const was = d; d = null; if (!was || was.mv || !S3.info) return;
    const r = cvs.getBoundingClientRect(); v.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(v, cam);
    for (const h of ray.intersectObjects(S3.pick, true)) { let o = h.object; while (o && o.userData.slot === undefined) o = o.parent;
      if (o) { const i = o.userData.slot; if (!S3.info.slots[i].fixed) hooks.pick(i); return; } } });
  requestAnimationFrame(loop); return S3;
}

function skyTex() { const g = S3.sky.getContext('2d'), I = S3.info, c = I.night ? NSKY : SKY[clamp(I.tier, 0, 3)], gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, c[0]); gr.addColorStop(1, c[1]); g.fillStyle = gr; g.fillRect(0, 0, 2, 256); S3.scene.background.needsUpdate = true; S3.scene.fog.color.set(I.night ? '#2b3266' : c[1]); }
function applyTier() { const t = clamp(S3.info.tier, 0, 3);
  const old = S3.grass.map; S3.grass.map = tx(grassCv(GRD[t]), 5, 4); S3.grass.needsUpdate = true; old && old.dispose();
  S3.decor.forEach((m, i) => m.material.color.set(PAD[t])); S3.fount.visible = t >= 1;
  [...S3.sk.children].forEach(c => { dispose(c); S3.sk.remove(c); });
  if (t === 0) for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, m = new THREE.Mesh(new THREE.SphereGeometry(7 + rnd(i) * 4, 10, 6), std('#86b872')); m.scale.y = .32; m.position.set(Math.cos(a) * 40, -1, Math.sin(a) * 40); S3.sk.add(m); }
  else { const n = [0, 14, 20, 26][t]; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rnd(i) * .1, R = 36 + rnd(i + 5) * 8, h = 5 + rnd(i + 9) * (4 + t * 4), w = 2.5 + rnd(i + 3) * 2, m = fmat('office', 1, h / 3);
      const b = bx(w, h, w, m, Math.cos(a) * R, -1, Math.sin(a) * R); b.castShadow = false; S3.sk.add(b); } }
  S3.cars.forEach((c, i) => c.visible = i <= t); skyTex(); }
function applyNight() { const n = S3.info.night, s = S3.sun;
  s.color.set(n ? 0x9db4ff : 0xfff1d6); s.intensity = n ? .6 : 2.6; s.position.set(n ? -8 : 10, n ? 14 : 16, n ? 6 : 8);
  S3.hemi.color.set(n ? 0x4a5a9a : 0xdff1ff); S3.hemi.groundColor.set(n ? 0x1a1630 : 0x8a7a66); S3.hemi.intensity = n ? .5 : 1.1; S3.ren.toneMappingExposure = n ? .95 : 1;
  S3.lampMat.emissiveIntensity = n ? 2.5 : 0; S3.pl.forEach(p => p.visible = n); WM.forEach(m => m.emissiveIntensity = n ? 1.4 : 0);
  S3.water.material.color.set(n ? '#1b3157' : '#3d83ab'); S3.cmat.color.set(n ? '#8d97c4' : '#fff'); S3.cmat.emissive.set(n ? '#1a2250' : '#fff'); skyTex(); }

function buildSlot(i, s) { const old = S3.groups[i]; if (old) { S3.scene.remove(old); dispose(old); S3.groups[i] = null; }
  if (s.own && s.t) { const g = MK[s.t](Math.max(1, s.lv)), [x, z] = pos(...CELLS[i]); g.position.set(x, .14, z); g.userData.slot = i; g.userData.nb = s.lv === 0; S3.hgt[i] = hOf(s.t, s.lv);
    if (s.up) g.traverse(n => { if (n.isMesh) [].concat(n.material).forEach(m => { m.transparent = true; m.opacity = .6; }); });
    S3.scene.add(g); S3.groups[i] = g; }
  S3.pick = [...S3.tiles, ...S3.groups.filter(Boolean)]; }

const pillH = p => !p ? '' : `<div class="pl ${p[2]}"${p[1] ? ` data-a="${p[1]}"` : ''}>${p[3] != null ? `<i style="width:${Math.round(p[3] * 100)}%"></i>` : ''}<span>${p[0]}</span></div>`;
function sync() { const I = S3.info; if (!I) return;
  if (S3.tier !== I.tier) { S3.tier = I.tier; applyTier(); }
  if (S3.night !== I.night) { S3.night = I.night; applyNight(); }
  const t = clamp(I.tier, 0, 3);
  I.slots.forEach((s, i) => { const sg = [s.own, s.t, s.lv, !!s.up].join('|'); if (S3.sig[i] !== sg) { S3.sig[i] = sg; buildSlot(i, s); }
    const g = S3.groups[i]; if (g && g.userData.nb) g.scale.y = .25 + .75 * (s.up ? s.up.p || 0 : 1);
    const tm = S3.tiles[i].material, c = CELLS[i], ck = (c[0] + c[1]) % 2;
    tm.color.set(!s.own ? '#7d746b' : ck ? ALT[t] : PAD[t]); tm.emissive.set(I.sel === i ? '#f2b84b' : !s.own && s.afford ? '#f2b84b' : '#000'); tm.emissiveIntensity = I.sel === i ? .55 : .12;
    S3.anc[i].y = s.t ? hOf(s.t, s.lv) + .9 : 1.1;
    let h = ''; if (!s.own) h = `<div class="m3k"><img src="assets/icons/lock.svg" width="16" height="16" alt=""> ${s.cost}</div>`; else if (!s.t) h = `<div class="m3k add">＋ ${s.build}</div>`;
    else h = (s.up ? `<div class="pl run"><i style="width:${Math.round((s.up.p || 0) * 100)}%"></i><span>${s.up.left}</span></div>` : pillH(s.pill)) + `<div class="nm">${s.name} Lv${Math.max(1, s.lv)}</div>`;
    if (!S3.lab[i]) { const e = document.createElement('div'); e.className = 'm3l'; S3.ov.appendChild(e); S3.lab[i] = e; }
    if (S3.lastLab[i] !== h) { S3.lastLab[i] = h; S3.lab[i].innerHTML = h; } }); }

const LP = u => { const a = 9.2, b = 7.2, L = 2 * (a + b); let s = (((u % 1) + 1) % 1) * L;
  if (s < a) return [-4.6 + s, -3.6, 0]; s -= a; if (s < b) return [4.6, -3.6 + s, -Math.PI / 2]; s -= b; if (s < a) return [4.6 - s, 3.6, Math.PI]; s -= a; return [-4.6, 3.6 - s, Math.PI / 2]; };
let last = 0;
function loop(t) { requestAnimationFrame(loop); const s = S3; if (!s || !s.wrap.isConnected || document.hidden || !s.info) return;
  const dt = Math.min(.1, (t - last) / 1000 || .016); last = t; s.tt += dt;
  const w = s.wrap.clientWidth; if (!w) return; const h = Math.round(w * 1.02); if (w !== s.w) { s.w = w; s.ren.setSize(w, h); s.wrap.style.height = h + 'px'; s.cam.aspect = w / h; s.cam.updateProjectionMatrix(); }
  const yaw = Math.PI / 4 + s.dyaw, pit = .62, D = 30; s.cam.position.set(Math.sin(yaw) * Math.cos(pit) * D, Math.sin(pit) * D + .5, Math.cos(yaw) * Math.cos(pit) * D); s.cam.lookAt(0, .3, 0);
  if ((s.fr++ & 1) === 0) { const p = s.water.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, s.wy[i] + Math.sin(p.getX(i) * .35 + s.tt) * .07 + Math.cos(p.getZ(i) * .3 + s.tt * 1.3) * .07); p.needsUpdate = true; s.water.geometry.computeVertexNormals(); }
  s.cars.forEach(c => { c.userData.u += dt / 26; const [x, z, r] = LP(c.userData.u); c.position.set(x, .06, z); c.rotation.y = r; });
  s.clouds.forEach(c => { c.position.x += dt * .9; if (c.position.x > 50) c.position.x = -50; });
  if (s.fount && s.fount.visible) s.fount.scale.y = .8 + Math.sin(s.tt * 3) * .2;
  const fi = s.info.slots.findIndex(q => q.t === 'factory'), fg = fi >= 0 && s.groups[fi];
  if (s.info.making && fg && fg.userData.chim && (s.fr % 20) === 0) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.14, 0), new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: .7, flatShading: true }));
    m.position.copy(fg.localToWorld(fg.userData.chim.clone())); m.userData.age = 0; s.scene.add(m); s.smoke.push(m); }
  s.smoke = s.smoke.filter(m => { m.userData.age += dt; m.position.y += dt * .7; m.position.x += dt * .12; const k = m.userData.age / 3; m.scale.setScalar(1 + k * 2.2); m.material.opacity = .7 * (1 - k); if (k >= 1) { s.scene.remove(m); m.geometry.dispose(); m.material.dispose(); return false; } return true; });
  s.ren.render(s.scene, s.cam);
  const v = new THREE.Vector3(); s.lab.forEach((e, i) => { v.copy(s.anc[i]).project(s.cam); e.style.transform = `translate(${(v.x * .5 + .5) * w}px,${(-v.y * .5 + .5) * h}px) translate(-50%,-100%)`; e.style.display = v.z > 1 ? 'none' : ''; }); }

export const update = info => { if (!ok) return; if (S3) { S3.info = info; sync(); } else pend = info; };
let pend = null;
export const attach = el => { if (!ok || !el) return; try { ensure(); if (pend) { S3.info = pend; pend = null; } if (!el.contains(S3.wrap)) el.appendChild(S3.wrap); sync(); } catch (e) { console.warn('3D init gagal, pakai peta SVG', e); ok = false; } };
