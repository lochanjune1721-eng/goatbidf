/* GOAT.lol — OptimizedImage: the one place an image gets rendered.
 *
 * Every face on the site comes through here, which is what makes the loading
 * policy possible to reason about. The URL is already in the database — this
 * file never talks to Wikimedia, and never talks to /api/photo. It decides
 * three things: what size to ask for, when to start loading, and what to show
 * while there is nothing to show.
 *
 * Priority, in the order the page needs them:
 *
 *   above the fold   eager, fetchpriority=high for the first two only
 *   near the fold    lazy, but an IntersectionObserver with 800px of margin
 *                    starts them well before they are scrolled to
 *   far below        lazy, and left alone until the reader comes near
 *
 * Every image carries width and height, so a card never moves when a picture
 * arrives. That is the whole reason .ph has aspect-ratio in the CSS as well:
 * belt and braces, because layout shift is not recoverable once it happens.
 */
(function () {
  'use strict';

  /* Wikimedia thumbnail URLs carry their width in the filename:
       .../thumb/a/ab/Name.jpg/320px-Name.jpg
     Any other width is the same URL with that number changed, which is how
     one stored URL becomes a whole srcset without another API call. */
  var PX = /\/(\d+)px-/;

  function widthOf(url) {
    var m = String(url || '').match(PX);
    return m ? Number(m[1]) : 0;
  }

  /* Ask for `w`, but never for more pixels than the original has: Wikimedia's
     thumbnailer answers 400, not 404, when the requested width is larger than
     the source, and a 400 renders as a broken image. */
  function atWidth(url, w, originalWidth) {
    if (!url || !PX.test(url)) return url;
    var capped = originalWidth ? Math.min(w, originalWidth) : w;
    return url.replace(PX, '/' + Math.round(capped) + 'px-');
  }

  /* The sizes worth offering. Cards render between 30 and 280 CSS pixels, so
     these cover 1x and 2x across the whole range without a 4000px original
     ever reaching a browser. */
  var LADDER = [160, 240, 320, 480, 640];

  function selfSrcset(person) {
    var out = [];
    for (var i = 0; i < SELF_SIZES.length; i++) {
      out.push(selfUrl(person, SELF_SIZES[i]) + ' ' + SELF_SIZES[i] + 'w');
    }
    return out.join(', ');
  }

  function srcsetFor(url, originalWidth) {
    if (!url || !PX.test(url)) return null;
    var out = [], seen = {};
    for (var i = 0; i < LADDER.length; i++) {
      var w = LADDER[i];
      if (originalWidth && w > originalWidth) {
        // Offer the original's own width once, then stop climbing.
        if (seen[originalWidth]) break;
        w = originalWidth; seen[w] = 1;
        out.push(atWidth(url, w, originalWidth) + ' ' + w + 'w');
        break;
      }
      if (seen[w]) continue;
      seen[w] = 1;
      out.push(atWidth(url, w, originalWidth) + ' ' + w + 'w');
    }
    return out.length > 1 ? out.join(', ') : null;
  }

  /* ------------------------------------------------------------------
     NEAR-VIEWPORT PRELOADING

     loading="lazy" alone starts a browser's own heuristic, which is
     conservative and varies. An observer with 800px of root margin makes the
     behaviour ours: an image one screen below the fold begins loading before
     anybody scrolls to it, and one ten screens down does not.
     ------------------------------------------------------------------ */
  var io = null;
  function observer() {
    if (io || typeof IntersectionObserver !== 'function') return io;
    io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (!entries[i].isIntersecting) continue;
        var img = entries[i].target;
        io.unobserve(img);
        start(img);
      }
    }, { rootMargin: '800px 0px', threshold: 0 });
    return io;
  }

  /* Hand the real URL over. Until this runs the element has data-src and no
     src, so nothing is fetched no matter what the browser's lazy heuristic
     decides on its own. */
  function start(img) {
    if (!img || img.dataset.started) return;
    img.dataset.started = '1';
    if (img.dataset.srcset) { img.srcset = img.dataset.srcset; img.removeAttribute('data-srcset'); }
    if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
  }

  /* ------------------------------------------------------------------
     PLACEHOLDER

     A person with no verified image is not an error state and must not look
     like one. Initials in gold on the card surface, sized by the box.
     ------------------------------------------------------------------ */
  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w[0]; }).join('').toUpperCase() || '?';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /**
   * Markup for one image box.
   *
   * @param {object} person  a people row: name, slug, image_status,
   *                         wikimedia_thumbnail_url, wikimedia_width, photo_path
   * @param {object} opts
   *   @param {number} opts.size      CSS pixels the box renders at. Drives which
   *                                  thumbnail is asked for; NOT a layout value —
   *                                  the CSS owns layout.
   *   @param {string} opts.priority  'high' | 'eager' | 'auto' | 'lazy'
   *   @param {string} opts.sizes     a sizes attribute, when the box is fluid
   *   @param {string} opts.caption   a caption rendered over the image
   *   @param {boolean} opts.plain    no gradient wash
   */
  function markup(person, opts) {
    opts = opts || {};
    person = person || {};
    var size = opts.size || 320;
    var cls = 'ph' + (opts.plain ? ' plain' : '') + (opts.className ? ' ' + opts.className : '');
    var mark = person.slug ? ' data-slug="' + esc(person.slug) + '"' : '';
    var cap = opts.caption ? '<span class="cap">' + esc(opts.caption) + '</span>' : '';
    var url = urlFor(person, size);

    if (!url) {
      return '<div class="' + cls + '"' + mark + ' data-image-status="' +
        esc(person.image_status || 'pending') + '">' +
        '<div class="initials">' + esc(initials(person.name)) + '</div>' + cap + '</div>';
    }

    /* Dimensions on the element itself. .ph is square, so the intrinsic ratio
       we declare matches the box and the reserved space is exact. */
    var ow = person.wikimedia_width || 0;
    var set = selfFile(person) ? selfSrcset(person) : srcsetFor(baseUrl(person), ow);
    var high = opts.priority === 'high';
    var eager = high || opts.priority === 'eager';

    var attrs =
      ' alt="' + esc(person.name || '') + '"' +
      ' width="' + size + '" height="' + size + '"' +
      ' decoding="async"' +
      ' data-i="' + esc(initials(person.name)) + '"';

    if (eager) {
      /* Visible now. Load it immediately, and mark only the genuinely critical
         ones as high — a page where everything is high priority has told the
         browser nothing. */
      attrs += ' loading="eager"' + (high ? ' fetchpriority="high"' : '') +
               ' src="' + esc(url) + '"' + (set ? ' srcset="' + esc(set) + '"' : '');
    } else {
      /* Below the fold. No src at all yet — the observer supplies it — and
         loading="lazy" as the floor for anyone without IntersectionObserver. */
      attrs += ' loading="lazy" data-src="' + esc(url) + '"' +
               (set ? ' data-srcset="' + esc(set) + '"' : '');
    }
    if (opts.sizes) attrs += ' sizes="' + esc(opts.sizes) + '"';

    return '<div class="' + cls + '"' + mark + ' data-image-status="' +
      esc(person.image_status || '') + '"><img' + attrs + '>' + cap + '</div>';
  }

  /* ------------------------------------------------------------------
     WHERE THE BYTES COME FROM

     Once a picture has been copied into our own bucket, photo_path holds just
     the file name and three sizes exist beside each other:

       photos/100/lionel-messi.jpg
       photos/300/lionel-messi.jpg
       photos/800/lionel-messi.jpg

     One column, three files, no list to keep in sync. Until that copy has
     happened the Wikimedia URL is used, so a board is never blank while the
     caching pass works through 2,926 people.
     ------------------------------------------------------------------ */
  var SELF_SIZES = [100, 300, 800];

  function selfFile(person) {
    var p = person && person.photo_path;
    if (!p) return null;
    // A path with a slash in it is a literal object from the older importer.
    return p.indexOf('/') === -1 ? p : null;
  }

  function selfUrl(person, size) {
    var file = selfFile(person);
    if (!file || !window.G || !window.G.photoUrl) return null;
    var pick = SELF_SIZES[SELF_SIZES.length - 1];
    for (var i = 0; i < SELF_SIZES.length; i++) {
      if (SELF_SIZES[i] >= size) { pick = SELF_SIZES[i]; break; }
    }
    return window.G.photoUrl(pick + '/' + file);
  }

  /* The remote thumbnail, before any resizing. */
  function baseUrl(person) {
    var G = window.G;
    if (person.photo_path) {
      var file = selfFile(person);
      return file ? selfUrl(person, SELF_SIZES[0])
                  : (G && G.photoUrl ? G.photoUrl(person.photo_path) : null);
    }
    /* Only a verified match is shown. An uncertain one is stored but withheld
       until a human approves it — attaching a maybe-wrong face to a real
       person is worse than showing initials. */
    if (person.image_status !== 'verified') return null;
    return person.wikimedia_thumbnail_url || null;
  }

  function urlFor(person, size) {
    // Ask for 2x the rendered box, which is what a phone actually displays.
    var want = Math.min(800, Math.max(100, size * 2));
    if (selfFile(person)) return selfUrl(person, want);
    var base = baseUrl(person);
    if (!base) return null;
    return atWidth(base, Math.min(640, Math.max(160, want)), person.wikimedia_width);
  }

  /* ------------------------------------------------------------------
     ACTIVATION — call once after markup lands in the DOM.
     ------------------------------------------------------------------ */
  function activate(root) {
    root = root || document;
    var imgs = root.querySelectorAll('img[data-src]');
    var ob = observer();
    for (var i = 0; i < imgs.length; i++) {
      if (ob) ob.observe(imgs[i]);
      else start(imgs[i]);          // no IntersectionObserver: load them all
    }
    // A broken URL falls back to initials rather than a browser's torn icon.
    var all = root.querySelectorAll('.ph img');
    for (var j = 0; j < all.length; j++) bindError(all[j]);
  }

  function bindError(img) {
    if (img.dataset.bound) return;
    img.dataset.bound = '1';
    img.addEventListener('error', function () {
      var d = document.createElement('div');
      d.className = 'initials';
      d.textContent = img.dataset.i || '?';
      if (img.parentNode) img.replaceWith(d);
    });
  }

  /* ------------------------------------------------------------------
     PRELOAD — for the couple of images that are certainly above the fold.

     A preload has to name the SAME candidate the <img> will choose, or the
     browser fetches one URL for the link and a different one for the element.
     With a srcset in play that means imagesrcset and imagesizes, not href:
     href alone preloads a width the element then declines to use.

     Two, never more. A preload list the browser cannot honour in order is the
     same as no priority at all.

     @param {Array<{person: object, size: number, sizes?: string}>} entries
     ------------------------------------------------------------------ */
  function preload(entries) {
    for (var i = 0; i < entries.length && i < 2; i++) {
      var e = entries[i] || {};
      var p = e.person || e;
      var base = baseUrl(p);
      if (!base) continue;
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = urlFor(p, e.size || 320);          // fallback for older browsers
      var set = selfFile(p) ? selfSrcset(p) : srcsetFor(base, p.wikimedia_width);
      if (set) {
        link.setAttribute('imagesrcset', set);
        if (e.sizes) link.setAttribute('imagesizes', e.sizes);
      }
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }
  }

  /* ------------------------------------------------------------------
     POKING THE RESOLVER

     A brand new deployment has 2,926 unresolved people and no reason for
     anything to start resolving them. The cron gets there once a day, which
     is no use to somebody who has just deployed and is looking at the site.

     So when a page notices unresolved people, it pokes /api/images once and
     forgets about it. That endpoint returns immediately and does the work
     server-side, chaining into fresh invocations of itself until the queue is
     empty — the browser is not involved beyond this one call, does not wait
     for it, and does not use the result. Once per session, only when there is
     something to do, and harmless if fifty visitors do it at once because the
     endpoint holds a lock.

     This is not the frontend resolving images. The frontend renders whatever
     is in the database and rings a bell on its way past.
     ------------------------------------------------------------------ */
  function poke(people) {
    try {
      if (sessionStorage.getItem('goat_poked')) return;
      var pending = false;
      for (var i = 0; i < people.length; i++) {
        var s = people[i] && people[i].image_status;
        if (s === 'pending' || s === undefined) { pending = s === 'pending'; if (pending) break; }
      }
      if (!pending) return;
      sessionStorage.setItem('goat_poked', '1');
      // Deliberately not awaited and deliberately not read.
      fetch('/api/images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
        keepalive: true
      }).catch(function () {});
    } catch (e) { /* private mode, no sessionStorage — skip it */ }
  }

  window.GImg = {
    poke: poke,
    markup: markup, activate: activate, preload: preload,
    urlFor: urlFor, atWidth: atWidth, srcsetFor: srcsetFor, baseUrl: baseUrl,
    selfUrl: selfUrl, selfFile: selfFile, SELF_SIZES: SELF_SIZES,
    initials: initials, widthOf: widthOf, LADDER: LADDER
  };
})();
