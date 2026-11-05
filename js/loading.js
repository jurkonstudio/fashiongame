// (c) 2026 FashionGame. All rights reserved.
// Helper layar memuat: spinner titik + teks. Dipakai shell awal, nanti juga Chat & Bursa.
import { T } from './i18n.js?v=28';
export const loading = txt => `<div class="ld" role="status" aria-live="polite"><span class="ld-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${txt || T('boot_load')}</span></div>`;
const B = () => window.__boot;   // dibuat oleh skrip splash di index.html; hilang setelah splash dihapus
export const boot = {
  lang: () => (B() && B().lang) || 'id',
  set: p => B() && B().set(p),
  msg: t => B() && B().msg(t),
  done: () => (B() ? B().done() : Promise.resolve())
};
