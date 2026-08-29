/* GOAT.lol — /image-test.html
 *
 * Twenty contenders rendered through the same GImg component the boards use,
 * with every image reporting on itself: what URL it asked for, what size came
 * back, how long it took, whether it was eager or lazy, and whether the
 * browser served it from cache.
 *
 * The point is to be able to see the priority order rather than believe it.
 * Ten rows sit above a full-viewport spacer and ten below; on a fresh load the
 * bottom ten should show nothing at all until you scroll toward them.
 */
(function () {
  'use strict';
  var G = window.G, Img = window.GImg;
  var $ = function (s) { return document.querySelector(s); };
  var t0 = performance.now();

  function tag(cls, text) { return '<span class="it-tag ' + cls + '">' + text + '</span>'; }

  /* Whether the bytes came off the network or out of cache. transferSize is 0
     for a cache hit and non-zero otherwise; a cross-origin response without
     Timing-Allow-Origin reports 0 for everything, so the encoded size is
     checked too rather than calling every Wikimedia image "cached". */
  function timing(url) {
    var e = performance.getEntriesByName(url);
    if (!e.length) return null;
    var r = e[e.length - 1];
    return {
      ms: Math.round(r.responseEnd - r.startTime),
      transferSize: r.transferSize,
      encodedBodySize: r.encodedBodySize,
      cached: r.transferSize === 0 && r.encodedBodySize > 0,
      opaque: r.transferSize === 0 && r.encodedBodySize === 0
    };
  }

  function report(box, p, eager, high) {
    var img = box.querySelector('img');
    var meta = box.parentNode.querySelector('.it-meta');
    if (!img) {
      meta.innerHTML = tag('it-lazy', 'no image') +
        '<br><b>' + G.esc(p.name) + '</b><br>' +
        'image_status: ' + G.esc(p.image_status || 'pending') +
        ' — placeholder shown, nothing requested.';
      return;
    }

    var started = performance.now();
    function done(ok) {
      var url = img.currentSrc || img.src;
      var t = timing(url);
      var ms = t ? t.ms : Math.round(performance.now() - started);
      meta.innerHTML =
        (high ? tag('it-high', 'fetchpriority high') : '') +
        tag(eager ? 'it-eager' : 'it-lazy', eager ? 'eager' : 'lazy') +
        (t && t.cached ? tag('it-cache', 'from cache') : '') +
        '<br><b>' + G.esc(p.name) + '</b>' +
        ' — ' + (ok ? img.naturalWidth + '×' + img.naturalHeight : 'FAILED') +
        ' in <b class="' + (ms > 1500 ? 'it-slow' : '') + '">' + ms + 'ms</b>' +
        (t && t.transferSize ? ' · ' + Math.round(t.transferSize / 1024) + 'kB over the wire' : '') +
        (t && t.opaque ? ' · size not disclosed (cross-origin)' : '') +
        '<br>source: <b>' + (p.photo_path ? 'Supabase storage' : 'Wikimedia CDN') + '</b>' +
        '<br>' + G.esc(url);
      tally();
    }
    if (img.complete && img.naturalWidth) done(true);
    else { img.addEventListener('load', function () { done(true); });
           img.addEventListener('error', function () { done(false); }); }

    /* An image that never starts is the interesting case on this page, so say
       so instead of leaving a blank row. */
    if (!eager) {
      meta.innerHTML = tag('it-lazy', 'lazy') + '<br><b>' + G.esc(p.name) +
        '</b><br>waiting — not requested yet.';
    }
  }

  function tally() {
    var boxes = document.querySelectorAll('.it-item');
    var loaded = 0, waiting = 0, bytes = 0;
    document.querySelectorAll('.it-item img').forEach(function (img) {
      if (img.complete && img.naturalWidth) {
        loaded++;
        var t = timing(img.currentSrc || img.src);
        if (t) bytes += t.transferSize || 0;
      } else waiting++;
    });
    var noImage = boxes.length - loaded - waiting;
    $('#stats').innerHTML =
      'rows <b>' + boxes.length + '</b>' +
      ' · loaded <b>' + loaded + '</b>' +
      ' · not yet requested <b>' + waiting + '</b>' +
      ' · no image <b>' + noImage + '</b>' +
      ' · transferred <b>' + Math.round(bytes / 1024) + 'kB</b>' +
      ' · since navigation <b>' + Math.round(performance.now() - t0) + 'ms</b>';
  }

  async function main() {
    if (!G.sb) { $('#stats').textContent = G.offlineMessage(); return; }

    var res = await G.withImageCols(function (extra) {
      return G.sb.from('people')
        .select('id,slug,name,photo_path' + extra)
        .order('name')
        .limit(20);
    });
    if (res.error) { $('#stats').textContent = G.explain(res.error); return; }

    var people = res.data || [];
    if (!people.length) {
      $('#stats').textContent = 'No people in the database. Run sql/seed.sql.';
      return;
    }

    /* The same policy a board uses: the first two high, the next six eager,
       the rest left to the observer. */
    var html = people.map(function (p, i) {
      var priority = i < 2 ? 'high' : i < 8 ? 'eager' : 'lazy';
      var box = Img.markup(p, { size: 100, priority: priority, plain: true });
      var spacer = i === 10
        ? '<div class="it-spacer">— one full viewport of nothing —<br>' +
          'everything below here should still be unrequested on a fresh load —</div>'
        : '';
      return spacer + '<div class="it-item" data-i="' + i + '">' + box +
             '<div class="it-meta">measuring…</div></div>';
    }).join('');

    $('#list').innerHTML = html;
    Img.preload(people.slice(0, 2).map(function (p) {
      return { person: p, size: 100 };
    }));
    Img.activate($('#list'));

    people.forEach(function (p, i) {
      var item = $('.it-item[data-i="' + i + '"]');
      report(item.querySelector('.ph'), p, i < 8, i < 2);
    });

    tally();
    setInterval(tally, 500);
  }

  main().catch(function (e) { $('#stats').textContent = String(e && e.message || e); });
})();
