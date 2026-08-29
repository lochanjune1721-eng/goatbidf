// js/optimized-image.js — every person renders a picture, always.
//
// Order of preference:
//   1. The stored photo (Wikimedia URL, or a path in Supabase storage).
//   2. If that URL is missing, or fails to load, a deterministic initials tile
//      — a gradient derived from the person's own name, so it reads as a
//      designed placeholder rather than a broken image.
//
// There is no state where a card is blank, and a person with no photo costs
// zero network requests instead of one guaranteed 400.

(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const isLocalDev = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  /** Stable 0-359 hue from a string, so a given name always gets the same tile. */
  function hueOf(text) {
    let hash = 2166136261;
    const value = String(text || '');
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash) % 360;
  }

  function gradientFor(name) {
    const hue = hueOf(name);
    return `linear-gradient(140deg, hsl(${hue} 42% 26%), hsl(${(hue + 34) % 360} 46% 13%))`;
  }

  /**
   * Resolves a stored photo reference to a loadable URL.
   * Returns null when there is nothing to load — the caller then renders initials.
   */
  function getThumb(sourceUrl, size = 120, name = '') {
    const clean = String(sourceUrl || '').trim().split('?')[0];
    if (!clean) return null;

    // In local dev everything goes through server.mjs, which caches and heals
    // broken Wikimedia links.
    if (isLocalDev) {
      return `/img?name=${encodeURIComponent(name || '')}&url=${encodeURIComponent(clean)}`;
    }

    if (/^https?:\/\//.test(clean)) return clean;

    const base = window.GOAT && window.GOAT.SUPABASE_URL;
    if (!base) return null;
    return `${base}/storage/v1/object/public/people/${clean.replace(/^\/+/, '')}`;
  }

  function initialsOf(name) {
    if (window.GOAT && window.GOAT.initials) return window.GOAT.initials(name);
    return name ? String(name).slice(0, 2).toUpperCase() : '?';
  }

  function esc(value) {
    if (window.GOAT && window.GOAT.esc) return window.GOAT.esc(value);
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fallbackMarkup(name, size, styleAttr) {
    // A person's name can contain quotes; everything interpolated here is escaped.
    const fontSize = Math.max(11, Math.round(Number(size) * 0.34));
    return (
      `<div class="fallback" role="img" aria-label="${esc(name)}"` +
      ` style="background:${gradientFor(name)};font-size:${fontSize}px${styleAttr}">` +
      `${esc(initialsOf(name))}</div>`
    );
  }

  /**
   * Swaps a failed <img> for the initials tile.
   * The name is read from the element's own alt text, so nothing is interpolated
   * into an inline handler.
   */
  function handleError(img) {
    if (!img || img.dataset.goatFallenBack === '1') return;
    img.dataset.goatFallenBack = '1';

    const name = img.getAttribute('alt') || '';
    const size = img.getAttribute('width') || 120;
    const parent = img.parentElement;
    if (!parent) return;

    const tile = document.createElement('div');
    tile.className = 'fallback';
    tile.setAttribute('role', 'img');
    tile.setAttribute('aria-label', name);
    tile.style.cssText =
      `position:absolute;inset:0;display:grid;place-items:center;` +
      `background:${gradientFor(name)};font-size:${Math.max(11, Math.round(Number(size) * 0.34))}px`;
    tile.textContent = initialsOf(name);

    img.replaceWith(tile);
  }
  window.onGoatImgError = handleError;

  /** Builds the markup for one portrait. */
  function render({ photoPath, name, size = 120, priority = 'lazy', className = '', style = '' }) {
    const styleAttr = style ? `;${style}` : '';
    const url = getThumb(photoPath, size, name);

    // Nothing to load — go straight to the tile, no failed request.
    if (!url) return fallbackMarkup(name, size, styleAttr);

    const loadAttrs = priority === 'eager'
      ? 'fetchpriority="high" loading="eager"'
      : 'loading="lazy"';

    return (
      `<img src="${esc(url)}" alt="${esc(name)}"` +
      ` width="${Number(size) || 120}" height="${Number(size) || 120}"` +
      ` ${loadAttrs} decoding="async" referrerpolicy="no-referrer"` +
      ` class="goat-photo${className ? ' ' + esc(className) : ''}"` +
      `${style ? ` style="${esc(style)}"` : ''}` +
      ` onerror="window.onGoatImgError(this)">`
    );
  }

  window.OptimizedImage = { render, getThumb, handleError, gradientFor };
})();
