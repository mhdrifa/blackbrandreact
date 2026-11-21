import { APP_MODE } from '../config/brand';

export const modeKey = (name) =>
  APP_MODE === 'production' ? name : `${APP_MODE}_${name}`;

export const money = (n) =>
  `Rs. ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;

export const placeholderImg =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect width="400" height="500" fill="#141414"/><text x="200" y="255" fill="#e4c280" font-family="Arial" font-size="20" text-anchor="middle" letter-spacing="5">BLACK BRAND</text></svg>'
  );

export const safeImg = (url) => url || placeholderImg;

export const isVideoUrl = (url) => /\.(mp4|webm)(\?|$)/i.test(String(url || ''));

export const isNewProduct = (p) => {
  const d = new Date(String(p.createdDate || '').replace(' ', 'T'));
  return Number.isFinite(d.getTime()) && Date.now() - d.getTime() < 30 * 86400000;
};

export const cssColor = (name) => {
  if (typeof Option === 'undefined') return '#888';
  const o = new Option().style;
  o.color = String(name || '').toLowerCase().replace(/\s+/g, '');
  return o.color || '#888888';
};

export const uniq = (arr) => arr.filter((v, i) => arr.indexOf(v) === i);

export const lsGet = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const lsSet = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch { /* ignore quota */ }
};

export const PHONE_RE = /^\+?[0-9][0-9\s\-()]{7,17}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const colomboToday = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });

export const colomboDaysAgo = (n) => {
  const d = new Date(`${colomboToday()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
};

export function csvCell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s) && !/^[+\-]?[0-9][0-9 ().,\-]*$/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadFile(name, text, type = 'text/csv;charset=utf-8') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}

export function toCsv(headers, rows) {
  return (
    '\ufeff' +
    [headers.map(csvCell).join(',')]
      .concat(rows.map((r) => r.map(csvCell).join(',')))
      .join('\r\n')
  );
}
