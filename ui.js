// Eleo Social: tiny UI toolkit (no framework needed).
// h() builds DOM with textContent only, so user text can never become HTML (XSS-safe).
import { avatarImageUrl } from './api/storage.js';

export function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

// ---- Icons (stroke icons, 24px grid) ---------------------------------------
const ICONS = {
  heart: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
  comment: ['M7.9 20A9 9 0 1 0 4 16.1L2 22Z'],
  bookmark: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z'],
  share: ['M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8', 'M16 6l-4-4-4 4', 'M12 2v13'],
  plus: ['M5 12h14', 'M12 5v14'],
  search: ['M21 21l-4.3-4.3', 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z'],
  home: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  bell: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
  x: ['M18 6 6 18', 'M6 6l12 12'],
  image: ['M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 8.5h.01', 'M21 15l-5-5L5 21'],
  pin: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  link: ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71', 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  seal: ['M12 2l2.4 2.1 3.2-.3 1 3 2.7 1.8-1 3.1 1 3.1-2.7 1.8-1 3-3.2-.3L12 22l-2.4-2.1-3.2.3-1-3-2.7-1.8 1-3.1-1-3.1 2.7-1.8 1-3 3.2.3z', 'M8.5 12l2.5 2.5 4.5-5'],
};

export function icon(name, size = 22) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon', `icon-${name}`);
  for (const d of ICONS[name] || []) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

// ---- Labels ----------------------------------------------------------------
export const PRO_LABELS = {
  fashion_designer: 'Fashion designer',
  tailor: 'Tailor',
  stylist: 'Stylist',
  seamstress: 'Seamstress',
  fashion_brand: 'Fashion brand',
  shoemaker: 'Shoemaker',
  bag_maker: 'Bag maker',
  accessories_designer: 'Accessories designer',
};

// ---- Time ------------------------------------------------------------------
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
export function timeAgo(iso) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day');
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function compactNumber(n) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);
}

// ---- Avatar ----------------------------------------------------------------
export function avatar(profile, size = 40) {
  const name = profile?.display_name || profile?.username || '?';
  const url = avatarImageUrl(profile?.avatar_url);
  const box = h('span', { class: 'avatar', style: `--size:${size}px` });
  if (url) {
    box.append(h('img', { src: url, alt: '', loading: 'lazy', decoding: 'async', width: size, height: size }));
  } else {
    box.append(h('span', { 'aria-hidden': 'true' }, name.trim().slice(0, 1).toUpperCase()));
  }
  return box;
}

export function verifiedSeal() {
  const s = h('span', { class: 'seal', title: 'Verified by Eleo', role: 'img', 'aria-label': 'Verified by Eleo' }, icon('seal', 16));
  return s;
}

// ---- Toasts ----------------------------------------------------------------
let toastRegion;
export function toast(message, kind = 'info') {
  if (!toastRegion) {
    toastRegion = h('div', { class: 'toast-region', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastRegion);
  }
  const t = h('div', { class: `toast toast-${kind}` }, message);
  toastRegion.append(t);
  setTimeout(() => t.remove(), kind === 'error' ? 6000 : 3500);
}

// ---- Confirm dialog (accessible, replaces window.confirm) --------------------
export function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    const dialog = h('dialog', { class: 'dialog', 'aria-labelledby': 'dlg-title' },
      h('h2', { id: 'dlg-title', class: 'dialog-title' }, title),
      h('p', { class: 'dialog-text' }, message),
      h('div', { class: 'dialog-actions' },
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => dialog.close('cancel') }, 'Cancel'),
        h('button', { type: 'button', class: `btn ${danger ? 'btn-danger' : 'btn-gold'}`, onclick: () => dialog.close('ok') }, confirmLabel),
      ));
    dialog.addEventListener('close', () => { resolve(dialog.returnValue === 'ok'); dialog.remove(); });
    document.body.append(dialog);
    dialog.showModal();
  });
}

// ---- Seed placeholders -------------------------------------------------------
const ART_TONES = ['#3a2f1c', '#2c3a33', '#3a2630', '#2b3342', '#3b3226', '#2f2b3d'];
export function placeholderArt(label, seedKey = '') {
  let hash = 0;
  for (const ch of seedKey + label) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return h('div', { class: 'post-art', style: `--tone:${ART_TONES[hash % ART_TONES.length]}`, role: 'img', 'aria-label': `${label} post (sample content)` },
    h('span', { class: 'post-art-label' }, label));
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

export function errorMessage(err, fallback = 'Something went wrong. Try again.') {
  if (!err) return fallback;
  if (err.code === '42501' || /row-level security/i.test(err.message || '')) return 'You do not have permission to do that.';
  if (err.message && !/^(TypeError|Failed to fetch)/.test(err.message) && err.message.length < 160) return err.message;
  return fallback;
}
