// Maps the canonical brand tokens (restaurant_themes.tokens) to the captain
// panel's CSS variables at runtime. Keep defaults in sync with index.css.

export const DEFAULT_TOKENS = { primary: '#D62828', accent: '#E23744' };

const HEX = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

/** Move a hex color toward black (amount<0) or white (amount>0), |amount| in 0..1. */
function shade(hex, amount) {
  const m = HEX.exec(hex);
  if (!m) return hex;
  const target = amount < 0 ? 0 : 255;
  const adj = (c) => {
    const v = parseInt(c, 16);
    return Math.round(v + (target - v) * Math.abs(amount));
  };
  const to2 = (n) => n.toString(16).padStart(2, '0');
  return `#${to2(adj(m[1]))}${to2(adj(m[2]))}${to2(adj(m[3]))}`;
}

function rgba(hex, a) {
  const m = HEX.exec(hex);
  if (!m) return hex;
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${a})`;
}

export function applyCaptainTheme(tokens) {
  const t = { ...DEFAULT_TOKENS, ...(tokens || {}) };
  const root = document.documentElement;
  root.style.setProperty('--color-primary', t.primary);
  root.style.setProperty('--color-primary-dark', shade(t.primary, -0.2));
  root.style.setProperty('--color-primary-light', t.accent);
  root.style.setProperty('--color-primary-hover', shade(t.primary, -0.1));
  root.style.setProperty('--color-primary-subtle', rgba(t.primary, 0.08));
}
