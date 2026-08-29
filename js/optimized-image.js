// js/optimized-image.js — Bulletproof Image Rendering Component for GOAT.lol
// Delivers fast, zero-failure images via local caching & auto-healing proxy in dev.

(function(){
  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  if(!isBrowser) return;

  /**
   * Resolve an image URL cleanly
   */
  function getThumb(sourceUrl, size = 120, name = '') {
    const clean = (sourceUrl || '').trim().split('?')[0];

    // In local dev, route through auto-healing caching proxy
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `/img?name=${encodeURIComponent(name || '')}&url=${encodeURIComponent(clean || '')}`;
    }

    // Already https — use it directly. Fastest path, no change.
    if (clean.startsWith('https://')) {
      return clean;
    }

    // Two cases that produce no picture in production:
    //   http:// — blocked by the browser as mixed content on an https page
    //   empty   — the person was seeded with photo_path = null
    // Both go through the healer, which upgrades the protocol or looks the
    // person up by name. This is what localhost has always done via server.mjs.
    if (!clean || clean.startsWith('http://')) {
      return `/api/img?name=${encodeURIComponent(name || '')}&url=${encodeURIComponent(clean || '')}`;
    }

    const baseUrl = window.GOAT?.SUPABASE_URL || 'https://iuvmzlrnbwptgrbkdbbn.supabase.co';
    return `${baseUrl}/storage/v1/object/public/people/${clean.replace(/^\/+/, '')}`;
  }

  /**
   * Handle image error with initials avatar fallback
   */
  function handleError(img, name) {
    if(!img) return;
    const initials = window.GOAT?.initials ? window.GOAT.initials(name) : (name ? name.slice(0,2).toUpperCase() : '?');
    const parent = img.parentElement;
    if(parent) {
      img.style.display = 'none';
      let fb = parent.querySelector('.fallback');
      if(!fb) {
        fb = document.createElement('div');
        fb.className = 'fallback';
        fb.style.cssText = 'width:100%;height:100%;display:grid;place-items:center;position:absolute;inset:0;';
        fb.textContent = initials;
        parent.appendChild(fb);
      } else {
        fb.style.display = 'grid';
      }
    }
  }
  window.onGoatImgError = handleError;

  /**
   * OptimizedImage.render: Generates resilient HTML for contender portraits
   */
  function render({ photoPath, name, size = 120, priority = 'lazy', className = '', style = '' }) {
    const safeName = (name || '').replace(/"/g, '&quot;');
    const resolvedUrl = getThumb(photoPath, size, name);
    const styleAttr = style ? ` style="${style}"` : '';
    const classAttr = className ? `goat-photo ${className}` : 'goat-photo';

    if(!resolvedUrl) {
      const initials = window.GOAT?.initials ? window.GOAT.initials(name) : (name ? name.slice(0,2).toUpperCase() : '?');
      return `<div class="fallback"${styleAttr}>${initials}</div>`;
    }

    const eagerAttrs = priority === 'eager' ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"';
    return `<img src="${resolvedUrl}" alt="${safeName}" width="${size}" height="${size}" ${eagerAttrs} decoding="async" referrerpolicy="no-referrer" class="${classAttr}"${styleAttr} onerror="window.onGoatImgError(this, '${safeName}')">`;
  }

  window.OptimizedImage = {
    render,
    getThumb,
    handleError
  };
})();
