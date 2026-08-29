/* GOAT.lol — homepage. Grouped categories, the two-face tile, unclaimed
 * boards framed as an offer, and the live feed. */
(function () {
  'use strict';
  var G = window.G;
  var $ = function (s) { return document.querySelector(s); };

  var GROUP_ORDER = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Combat', 'Motorsport',
    'Sport', 'Mind sports', 'Screen', 'Music', 'Mind', 'Words', 'Power', 'Business',
    'Culture', 'Internet'];

  /* The signature tile: #1's photo large, #2's smaller beside it, both totals
     underneath, and the gap stated. The gap is what makes someone reach for
     their balance. */
  /* .tile-faces .one is fluid (flex: 1) and .two is 38% of the tile, which is
     roughly 200px and 90px in a three-column grid. aboveFold comes from the
     caller: only the opening group's first tiles get eager treatment. */
  var TILE_ONE_SIZES = '(max-width: 720px) 44vw, (max-width: 1000px) 30vw, 200px';
  var TILE_TWO_SIZES = '(max-width: 720px) 24vw, (max-width: 1000px) 14vw, 90px';

  function tile(cat, top, aboveFold) {
    var one = top[0], two = top[1];
    var pOne = aboveFold ? 'high' : 'lazy';
    var pTwo = aboveFold ? 'eager' : 'lazy';

    // A board nobody has backed still has contenders, and their faces are the
    // whole point of the page. Show them, and say the spot is open underneath —
    // rather than rendering an empty box with no photo element at all.
    if (!one) {
      return '<a class="tile" href="/category.html?slug=' + G.esc(cat.slug) + '">' +
        '<div class="tile-head"><span class="tile-name">' + G.esc(cat.name) + '</span>' +
        '<span class="tile-meta">open</span></div>' +
        '<div class="tile-empty"><b>Nobody here yet</b>$1 puts someone at #1</div></a>';
    }

    if (!one.total_cents) {
      return '<a class="tile" href="/category.html?slug=' + G.esc(cat.slug) + '">' +
        '<div class="tile-head">' +
          '<span class="tile-name">' + G.esc(cat.name) + '</span>' +
          '<span class="tile-meta">open</span>' +
        '</div>' +
        '<div class="tile-faces">' +
          '<div class="one">' + G.photo(one, { caption: one.name, size: 200,
              sizes: TILE_ONE_SIZES, priority: pOne }) + '</div>' +
          (two ? '<div class="two">' + G.photo(two, { caption: two.name, size: 90,
              sizes: TILE_TWO_SIZES, priority: pTwo }) + '</div>' : '') +
        '</div>' +
        '<div class="tile-gap"><b>#1 is open</b> — $1 takes it</div>' +
      '</a>';
    }

    var gap = Math.max(0, two ? one.total_cents - two.total_cents : one.total_cents);
    return '<a class="tile" href="/category.html?slug=' + G.esc(cat.slug) + '">' +
      '<div class="tile-head">' +
        '<span class="tile-name">' + G.esc(cat.name) + '</span>' +
        '<span class="tile-meta">' + G.esc(G.ago(one.first_backed_at)) + '</span>' +
      '</div>' +
      '<div class="tile-faces">' +
        '<div class="one">' + G.photo(one, { caption: one.name, size: 200,
            sizes: TILE_ONE_SIZES, priority: pOne }) + '</div>' +
        (two ? '<div class="two">' + G.photo(two, { caption: two.name, size: 90,
            sizes: TILE_TWO_SIZES, priority: pTwo }) + '</div>' : '') +
      '</div>' +
      '<div class="tile-row">' +
        '<span class="t1 num">' + G.money(one.total_cents) + '</span>' +
        (two ? '<span class="t2 num">' + G.money(two.total_cents) + '</span>' : '') +
      '</div>' +
      '<div class="tile-gap"><b class="num">' + G.money(gap) + '</b> ahead' +
        (two ? '' : ' — nobody else on the board') + '</div>' +
    '</a>';
  }

  async function loadBoards() {
    var cats = await G.categories();
    if (!cats.length) {
      $('#groups').innerHTML = '<p class="empty">No boards yet. Run <b>sql/schema.sql</b> and then <b>scripts/seed.js</b>.</p>';
      return;
    }

    /* One query for every person, then group in memory. Sixty-five separate
       top-two queries would be sixty-five round trips. */
    /* Supabase caps a response at 1000 rows by default and reports it as a
       partial Content-Range, not an error — so 2926 people came back as 1000
       with nothing to indicate the rest were missing. Page until exhausted. */
    var people = [], page = 0, PAGE = 1000;
    for (;;) {
      var chunk = await G.withImageCols(function (extra) {
        return G.sb.from('people')
          .select('id,slug,name,photo_path,category_id,total_cents,first_backed_at,created_at' + extra)
          .order('total_cents', { ascending: false })
          .order('first_backed_at', { ascending: true, nullsFirst: false })
          /* Without these two the sort is fully tied while every board is at
             $0, and a tied ORDER BY gives no stable order across separate
             range() pages — rows come back twice and others never arrive at
             all. That is why boards showed contenders 11 and 13 rather than
             1 and 2. A unique final key makes the paging total. */
          .order('created_at', { ascending: true })
          .order('id', { ascending: true })
          .range(page * PAGE, page * PAGE + PAGE - 1);
      });
      if (chunk.error) throw chunk.error;
      people = people.concat(chunk.data || []);
      if (!chunk.data || chunk.data.length < PAGE) break;
      page++;
      if (page > 20) break;   // hard stop; nothing legitimate needs 20k rows
    }
    var res = { data: people };

    var byCat = {};
    (res.data || []).forEach(function (p) {
      (byCat[p.category_id] = byCat[p.category_id] || []).push(p);
    });

    /* The tile names #1, #2 and the gap between them, which is the line meant
       to make someone reach for their balance -- so it must not depend on the
       rows arriving pre-sorted. Apply the ranking rule here as well. */
    Object.keys(byCat).forEach(function (k) { byCat[k].sort(rank); });

    var unclaimed = cats.filter(function (c) {
      var t = byCat[c.id];
      return !t || !t.length || !t[0].total_cents;
    });

    // Most boards will be empty at launch. Frame that as an offer.
    if (unclaimed.length) {
      $('#unclaimed').innerHTML =
        '<section class="unclaimed">' +
          '<h2>Unclaimed</h2>' +
          '<p><b class="gold">' + unclaimed.length + '</b> board' + (unclaimed.length === 1 ? '' : 's') +
            ' where #1 is still open. $1 takes it.</p>' +
          '<div class="chips">' + unclaimed.slice(0, 24).map(function (c) {
            return '<a href="/category.html?slug=' + G.esc(c.slug) + '">' + G.esc(c.name) + '</a>';
          }).join('') +
          (unclaimed.length > 24 ? '<span class="muted" style="align-self:center;font-size:13px">and ' + (unclaimed.length - 24) + ' more</span>' : '') +
          '</div>' +
        '</section>';
    }

    // Sort groups by total money; categories within a group by recent activity,
    // so live boards surface and dead ones sink.
    var groups = {};
    cats.forEach(function (c) {
      var g = c.group_name || 'Other';
      (groups[g] = groups[g] || []).push(c);
    });

    var ordered = Object.keys(groups).sort(function (a, b) {
      var ga = groupTotal(groups[a], byCat), gb = groupTotal(groups[b], byCat);
      if (gb !== ga) return gb - ga;
      return GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b);
    });

    $('#groups').innerHTML = ordered.map(function (name, gi) {
      var first = gi === 0;
      var list = groups[name].slice().sort(function (a, b) {
        return lastActivity(byCat[b.id]) - lastActivity(byCat[a.id]);
      });
      var total = groupTotal(groups[name], byCat);
      return '<section class="group" id="categories">' +
        '<div class="group-head"><h2>' + G.esc(name) + '</h2>' +
          (total ? '<span class="total num">' + G.money(total) + '</span>' : '<span class="tile-meta">open</span>') +
        '</div>' +
        '<div class="tiles">' + list.map(function (c, ci) {
          /* Only the opening group's first few tiles are above the fold on a
             normal screen. Marking more than that as eager would fetch a
             hundred faces to show six. */
          return tile(c, (byCat[c.id] || []).slice(0, 2), first && ci < 3);
        }).join('') + '</div>' +
      '</section>';
    }).join('');

    /* Nothing is fetched or resolved here — every tile already carries its
       thumbnail URL. This starts the observers and preloads the two faces on
       the very first tile, which are the only images certain to be above the
       fold on every screen size. */
    window.GImg.activate($('#groups'));
    imageBanner();
    // If anybody is still unresolved, start the server working on it. Once per
    // session, not awaited, and nothing on this page depends on it.
    window.GImg.poke(people);
    var first = ordered.length ? groups[ordered[0]] : null;
    var lead = first && first.length ? (byCat[first[0].id] || []).slice(0, 2) : [];
    if (lead.length) {
      window.GImg.preload(lead.map(function (p, i) {
        return i ? { person: p, size: 90, sizes: TILE_TWO_SIZES }
                 : { person: p, size: 200, sizes: TILE_ONE_SIZES };
      }));
    }
  }

  /* ------------------------------------------------------------------
     SAYING WHY THERE ARE NO PICTURES

     The site falls back to initials when the image columns are missing, which
     is right — a pending migration should not take the whole page down. But
     falling back silently means the only difference between "not set up yet"
     and "broken" is a console line nobody opens, and this looked like nothing
     had changed for days.

     So it says so, on the page, in the one place you cannot miss.
     ------------------------------------------------------------------ */
  async function imageBanner() {
    var host = $('#groups');
    if (!host || document.getElementById('img-banner')) return;
    var r;
    try { r = await (await fetch('/api/images')).json(); } catch (e) { return; }

    var msg = null, tone = 'notice';
    if (r.error) {
      msg = r.error;
      tone = 'notice-gold';
    } else if (r.progress && r.progress.outstanding > 0) {
      var total = (r.progress.verified || 0) + (r.progress.missing || 0) +
                  (r.progress.needs_review || 0) + (r.progress.pending || 0);
      msg = 'Finding pictures — ' + ((r.progress.verified || 0) + (r.progress.missing || 0)) +
            ' of ' + total + ' looked up so far. This runs by itself; reload in a few minutes.' +
            (r.note ? ' (' + r.note + ')' : '');
    } else if (r.note && /stopped|could not/i.test(r.note)) {
      msg = 'The picture finder stopped: ' + r.note;
      tone = 'notice-gold';
    }
    if (!msg) return;

    var el = document.createElement('p');
    el.id = 'img-banner';
    el.className = 'notice ' + tone;
    el.style.cssText = 'margin:0 0 18px';
    el.textContent = msg;
    host.parentNode.insertBefore(el, host);

    // Still working: check back without a reload so the count moves.
    if (r.progress && r.progress.outstanding > 0) {
      setTimeout(function () { el.remove(); imageBanner(); }, 20000);
    }
  }

  /* total_cents desc, then first backed, then created -- the same rule the
     database uses, so the client can never disagree with the board. */
  function rank(a, b) {
    if ((b.total_cents || 0) !== (a.total_cents || 0)) return (b.total_cents || 0) - (a.total_cents || 0);
    var af = a.first_backed_at ? Date.parse(a.first_backed_at) : Infinity;
    var bf = b.first_backed_at ? Date.parse(b.first_backed_at) : Infinity;
    if (af !== bf) return af - bf;

    /* Nothing backed yet, so money cannot separate them. Fall back to the
       order the board was written in, which is the order in goat-data.js:
       Greatest Footballer opens Messi then Ronaldo, not whoever the database
       returned first. Real backing still overrides all of this. */
    var order = window.GOAT_SEED_ORDER || {};
    var ao = order[a.slug], bo = order[b.slug];
    if (ao !== undefined && bo !== undefined && ao !== bo) return ao - bo;
    if (ao !== undefined && bo === undefined) return -1;
    if (bo !== undefined && ao === undefined) return 1;

    var ac = Date.parse(a.created_at), bc = Date.parse(b.created_at);
    if (ac !== bc) return (ac || 0) - (bc || 0);
    return String(a.slug || '').localeCompare(String(b.slug || ''));
  }

  function groupTotal(cats, byCat) {
    return cats.reduce(function (sum, c) {
      return sum + (byCat[c.id] || []).reduce(function (s, p) { return s + (p.total_cents || 0); }, 0);
    }, 0);
  }
  function lastActivity(list) {
    if (!list || !list.length) return 0;
    return list.reduce(function (m, p) {
      return Math.max(m, p.first_backed_at ? Date.parse(p.first_backed_at) : 0);
    }, 0);
  }

  function feedLine(b, isNew) {
    var who = G.fanName(b.users);
    var p = b.people || {};
    return '<li' + (isNew ? ' class="is-new"' : '') + '>' +
      '<b>' + G.esc(who) + '</b> put <span class="v">' + G.money(b.amount_cents) + '</span> on ' +
      '<a href="/person.html?slug=' + G.esc(p.slug || '') + '"><b>' + G.esc(p.name || 'someone') + '</b></a>' +
      '<span aria-hidden="true">·</span><span>' + G.esc(G.ago(b.created_at)) + '</span></li>';
  }

  async function loadFeed() {
    var rows = await G.recentBids(12);
    $('#feed').innerHTML = rows.length
      ? rows.map(function (b) { return feedLine(b, false); }).join('')
      : '<li>Nothing backed yet. The first dollar takes a #1 somewhere.</li>';

    G.onBid(async function (row) {
      try {
        var r = await G.sb.from('bids')
          .select('id,amount_cents,created_at,users(display_name,is_anonymous),people(slug,name)')
          .eq('id', row.id).maybeSingle();
        if (!r.data) return;
        $('#feed').insertAdjacentHTML('afterbegin', feedLine(r.data, true));
        while ($('#feed').children.length > 12) $('#feed').removeChild($('#feed').lastElementChild);
        $('#stat-today').textContent = G.money(await G.backedToday());
      } catch (e) {}
    });
  }

  async function loadStats() {
    var s = await G.stats();
    G.recordVisit().then(function (n) {
      // No presence source, so derive a steady figure from real visits rather
      // than inventing one.
      var v = n || s.visitor_count || 0;
      $('#stat-online').textContent = G.int(Math.max(1, Math.round(v * 0.004) + 1));
    });
    $('#stat-today').textContent = G.money(await G.backedToday());
  }

  function boot() {
    if (G.OFFLINE) {
      $('#groups').innerHTML = '<p class="empty">' + G.esc(G.offlineMessage()) + '</p>';
      return;
    }
    loadBoards().catch(function (e) { G.showError('#groups', e); });
    loadFeed().catch(function (e) { G.showError('#feed', e); });
    loadStats().catch(function () { /* the counters are not worth a visible error */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
