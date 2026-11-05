// (c) 2026 FashionGame. Bilah sub-menu bawah (gaya Sim Companies): ikon + label kecil, menempel di atas navigasi utama.
import { ic } from './icons.js?v=25';
import { T } from './i18n.js?v=25';
export const subbar = (items, cur, act) => `<div class="subbar">${items.map(([k, i, l]) => `<button class="${k === cur ? 'on' : ''}" data-a="${act}:${k}" aria-label="${T(l)}">${ic(i)}<span>${T(l)}</span></button>`).join('')}</div>`;
