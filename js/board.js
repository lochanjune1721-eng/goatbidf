/* GOAT.lol — the tapering leaderboard and the back control.
 *
 * The moment this file exists for: someone taps $1, the number moves, the
 * board reorders, and their handle appears on the fan list. No modal, no
 * confirmation, no redirect, no reload.
 */
(function () {
  'use strict';
  var G = window.G;

  function tierOf(rank) {
    if (rank === 1) return 1;
    if (rank === 2) return 2;
    if (rank === 3) return 3;
    if (rank <= 10) return 4;
    return 11;
  }

  /* What this person needs to move up one place — the line that makes someone
     reach for their balance. */
  function stakes(rows, index) {
    var me = rows[index];
    if (index === 0) return 'holding #1';
    var above = rows[index - 1];
    // Taking #1 costs at least $5 more than the leader; every other place
    // needs only a dollar more than the person directly above.
    var target = index === 1
      ? above.total_cents + 500
      : above.total_cents + 100;
    var need = Math.max(100, target - me.total_cents);
    return G.money(need) + ' puts them at #' + index;
  }

  function fanStrip(fans) {
    if (!fans || !fans.length) return '<span>no backers yet</span>';
    return fans.slice(0, 3).map(function (f, i) {
      return '<span class="fan">' + G.esc(G.fanName(f.users)) + '</span>' +
             (i < Math.min(3, fans.length) - 1 ? '<span aria-hidden="true">·</span>' : '');
    }).join('');
  }

  /* What each tier actually renders at, mirroring --photo in style.css across
     its three breakpoints. Getting this wrong costs bandwidth in one direction
     and sharpness in the other, so it is written next to the tier that owns it
     rather than guessed from one number. */
  var TIER_SIZE = { 1: 280, 2: 200, 3: 160, 4: 100, 11: 64 };
  var TIER_SIZES = {
    1: '(max-width: 720px) 92vw, (max-width: 1000px) 200px, 280px',
    2: '(max-width: 720px) 96px, (max-width: 1000px) 150px, 200px',
    3: '(max-width: 720px) 84px, (max-width: 1000px) 120px, 160px',
    4: '(max-width: 720px) 60px, 100px',
    11: '(max-width: 720px) 60px, 64px'
  };

  function rowMarkup(p, rank, opts) {
    opts = opts || {};
    var tier = tierOf(rank);
    return '' +
      '<article class="row" data-tier="' + tier + '" data-person="' + G.esc(p.id) + '" data-slug="' + G.esc(p.slug) + '" data-rank="' + rank + '">' +
        '<span class="row-rank num">#' + rank + '</span>' +
        G.photo(p, { plain: true, size: TIER_SIZE[tier] || 64,
                     sizes: TIER_SIZES[tier], priority: priorityFor(rank) }) +
        '<div class="row-body">' +
          '<h3 class="row-name"><a href="/person.html?slug=' + G.esc(p.slug) + '">' + G.esc(p.name) + '</a></h3>' +
          (p.blurb ? '<p class="row-blurb">' + G.esc(p.blurb) + '</p>' : '') +
          '<div class="row-fans" data-fans>' + fanStrip(opts.fans) + '</div>' +
        '</div>' +
        '<div class="row-right">' +
          '<span class="row-total num" data-total>' + G.money(p.total_cents) + '</span>' +
          '<span class="row-stakes" data-stakes>' + G.esc(opts.stakes || '') + '</span>' +
          '<span class="back">' +
            '<span class="stepbox">' +
              '<button type="button" data-step="-1" aria-label="Less">−</button>' +
              '<span class="amt num" data-amt>$1</span>' +
              '<button type="button" data-step="1" aria-label="More">+</button>' +
            '</span>' +
            '<button class="btn btn-gold btn-sm" type="button" data-back>Back</button>' +
          '</span>' +
        '</div>' +
      '</article>';
  }

  /* ------------------------------------------------------------------
     RENDER — fan strips are fetched in one query for the whole page
     rather than one per row.
     ------------------------------------------------------------------ */

  async function render(host, rows, startRank) {
    if (!rows.length) {
      host.innerHTML = '<p class="empty">Nobody is on this board yet. ' +
        '<b>$1 takes #1.</b></p>';
      return;
    }
    var fansByPerson = {};
    try {
      var ids = rows.map(function (r) { return r.id; });
      var res = await G.sb.from('fan_totals')
        .select('person_id,total_cents,users(display_name,is_anonymous)')
        .in('person_id', ids)
        .order('total_cents', { ascending: false });
      (res.data || []).forEach(function (f) {
        (fansByPerson[f.person_id] = fansByPerson[f.person_id] || []).push(f);
      });
    } catch (e) { /* strips fall back to "no backers yet" */ }

    host.innerHTML = rows.map(function (p, i) {
      return rowMarkup(p, startRank + i, {
        fans: fansByPerson[p.id],
        stakes: stakes(rows, i)
      });
    }).join('');
    bind(host, rows);
    window.GImg.activate(host);
    /* Only the first board on a page preloads, and only its top two — each
       with the size and sizes its own tier renders at, so the preload names
       the candidate the element will pick. */
    if (startRank === 1) {
      window.GImg.preload(rows.slice(0, 2).map(function (p, i) {
        var t = tierOf(i + 1);
        return { person: p, size: TIER_SIZE[t], sizes: TIER_SIZES[t] };
      }));
    }
  }

  /* ------------------------------------------------------------------
     PICTURES

     There is nothing to fetch here. Every row arrived from Postgres with its
     thumbnail URL already on it, so this only decides what loads first:

       rank 1-3   above the fold on any screen, and the largest cards on the
                  page. Eager, and the top two marked high priority.
       rank 4-8   eager, ordinary priority — usually visible, cheap either way.
       the rest   left to GImg's observer, which starts them 800px early.

     A board of fifty people therefore opens by fetching about eight images,
     not fifty, and the rest arrive ahead of the scroll.
     ------------------------------------------------------------------ */

  var EAGER_ROWS = 8;

  function priorityFor(rank) {
    if (rank <= 2) return 'high';
    if (rank <= EAGER_ROWS) return 'eager';
    return 'lazy';
  }

  /* ------------------------------------------------------------------
     BACKING — optimistic reorder in place, no reload.
     ------------------------------------------------------------------ */

  function bind(host, rows) {
    if (host.dataset.bound) { host.dataset.rows = ''; }
    host.dataset.bound = '1';

    if (host._goatHandler) host.removeEventListener('click', host._goatHandler);

    host._goatHandler = async function (e) {
      var step = e.target.closest ? e.target.closest('[data-step]') : null;
      if (step) {
        var box = step.closest('.stepbox');
        var el = box.querySelector('[data-amt]');
        var v = parseInt(el.textContent.replace(/\D/g, ''), 10) || 1;
        v = Math.max(1, v + parseInt(step.getAttribute('data-step'), 10));
        el.textContent = '$' + v;
        return;
      }

      var back = e.target.closest ? e.target.closest('[data-back]') : null;
      if (!back) return;

      var row = back.closest('.row');
      var personId = row.getAttribute('data-person');
      var amtEl = row.querySelector('[data-amt]');
      var dollars = parseInt(amtEl.textContent.replace(/\D/g, ''), 10) || 1;

      if (!G.me) { toast('Sign in to back someone.', '/wallet.html', 'Sign in'); return; }
      if (G.me.balance_cents < dollars * 100) {
        toast('Not enough credit. You have ' + G.money(G.me.balance_cents) + '.', '/wallet.html', 'Add credit');
        return;
      }

      back.disabled = true;
      try {
        var res = await G.placeBid(personId, dollars * 100);
        var totalEl = row.querySelector('[data-total]');
        totalEl.textContent = G.money(res.total_cents);
        var r = rows.filter(function (x) { return x.id === personId; })[0];
        if (r) r.total_cents = res.total_cents;
        row.classList.add('is-bumped');
        setTimeout(function () { row.classList.remove('is-bumped'); }, 520);
        reorder(host, rows);
      } catch (err) {
        toast(err.message);
      } finally {
        back.disabled = false;
      }
    };
    host.addEventListener('click', host._goatHandler);
  }

  /* Re-sort in place and repaint rank, tier and stakes, so the board moves
     under the person's finger without a round trip. */
  function reorder(host, rows) {
    rows.sort(function (a, b) {
      if (b.total_cents !== a.total_cents) return b.total_cents - a.total_cents;
      var af = a.first_backed_at ? Date.parse(a.first_backed_at) : Infinity;
      var bf = b.first_backed_at ? Date.parse(b.first_backed_at) : Infinity;
      if (af !== bf) return af - bf;
      return Date.parse(a.created_at) - Date.parse(b.created_at);
    });

    var start = parseInt(host.getAttribute('data-start') || '1', 10);
    var frag = document.createDocumentFragment();
    rows.forEach(function (p, i) {
      var el = host.querySelector('[data-person="' + CSS.escape(p.id) + '"]');
      if (!el) return;
      var rank = start + i;
      el.setAttribute('data-rank', rank);
      el.setAttribute('data-tier', tierOf(rank));
      el.querySelector('.row-rank').textContent = '#' + rank;
      el.querySelector('[data-stakes]').textContent = stakes(rows, i);
      frag.appendChild(el);
    });
    host.appendChild(frag);
  }

  /* ------------------------------------------------------------------ */

  var toastEl = null;
  function toast(msg, href, label) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'notice notice-gold';
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText =
        'position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:80;' +
        'max-width:min(440px,calc(100vw - 32px));margin:0;display:flex;gap:12px;align-items:center';
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = '<span style="flex:1">' + G.esc(msg) + '</span>' +
      (href ? '<a class="btn btn-sm btn-gold" href="' + G.esc(href) + '">' + G.esc(label || 'Go') + '</a>' : '');
    toastEl.classList.remove('hide');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.add('hide'); }, 6000);
  }

  window.GBoard = {
    priorityFor: priorityFor, TIER_SIZE: TIER_SIZE,
    tierOf: tierOf, rowMarkup: rowMarkup, render: render, bind: bind,
    reorder: reorder, stakes: stakes, fanStrip: fanStrip, toast: toast
  };
})();
