/* GOAT.lol — one person (?slug=): portrait, total, rank, full fan board. */
(function () {
  'use strict';
  var G = window.G, B = window.GBoard;
  var host = document.getElementById('person');

  async function boot() {
    if (G.OFFLINE) { host.innerHTML = '<p class="empty">' + G.esc(G.offlineMessage()) + '</p>'; return; }
    var slug = G.qs('slug');
    var p = slug ? await G.person(slug) : null;
    if (!p) { host.innerHTML = '<p class="empty">Nobody at that address. <a href="/">See the boards</a>.</p>'; return; }

    document.title = p.name + ' — GOAT.lol';
    var cat = p.categories || {};

    var rankRes = await G.sb.from('people').select('id', { count: 'exact', head: true })
      .eq('category_id', p.category_id).gt('total_cents', p.total_cents);
    var rank = (rankRes.count || 0) + 1;

    var fans = await G.fansOf(p.id, 100);
    var wiki = G.safeUrl(p.wikipedia_url);

    host.innerHTML =
      '<div class="person">' +
        '<div>' +
          G.photo(p, { plain: true, size: 320, priority: 'high',
                       sizes: '(max-width: 720px) 92vw, 320px' }) +
          (p.photo_credit || p.photo_license
            ? '<p class="credit">Photo: ' + G.esc(p.photo_credit || 'unknown') +
              (p.photo_license ? ' · ' + G.esc(p.photo_license) : '') + '</p>'
            : '') +
        '</div>' +
        '<div>' +
          '<p class="muted" style="font-size:13px">' +
            '<a href="/category.html?slug=' + G.esc(cat.slug || '') + '">' + G.esc(cat.name || '') + '</a>' +
            ' · #' + rank + '</p>' +
          '<h1>' + G.esc(p.name) + '</h1>' +
          (p.blurb ? '<p class="sub">' + G.esc(p.blurb) + '</p>' : '') +
          '<p class="bigtotal num" style="margin-top:20px" data-total>' + G.money(p.total_cents) + '</p>' +
          '<p class="muted" style="font-size:14px">from <span data-backers>' + G.int(p.backer_count) + '</span> ' +
            'backer' + (p.backer_count === 1 ? '' : 's') + '</p>' +

          '<div class="back" style="margin-top:20px">' +
            '<span class="stepbox">' +
              '<button type="button" data-step="-1" aria-label="Less">−</button>' +
              '<span class="amt num" data-amt>$1</span>' +
              '<button type="button" data-step="1" aria-label="More">+</button>' +
            '</span>' +
            '<button class="btn btn-gold" type="button" data-back-person>Back ' + G.esc(p.name.split(' ')[0]) + '</button>' +
          '</div>' +

          (wiki ? '<p style="margin-top:16px"><a class="btn btn-sm" href="' + G.esc(wiki) +
                  '" target="_blank" rel="noopener noreferrer">Wikipedia</a></p>' : '') +

          '<div class="panel" style="margin-top:26px">' +
            '<h2>Top fans</h2>' +
            '<ul class="fanlist" id="fanlist">' + fanRows(fans) + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* Nothing to resolve: the row arrived with its thumbnail URL. This only
       binds the fallback and starts any below-fold observers on the page. */
    window.GImg.activate(host);

    host.addEventListener('click', async function (e) {
      var step = e.target.closest('[data-step]');
      if (step) {
        var el = host.querySelector('[data-amt]');
        var v = Math.max(1, (parseInt(el.textContent.replace(/\D/g, ''), 10) || 1) +
          parseInt(step.getAttribute('data-step'), 10));
        el.textContent = '$' + v;
        return;
      }
      var back = e.target.closest('[data-back-person]');
      if (!back) return;
      var dollars = parseInt(host.querySelector('[data-amt]').textContent.replace(/\D/g, ''), 10) || 1;
      if (!G.me) return B.toast('Sign in to back someone.', '/wallet.html', 'Sign in');
      if (G.me.balance_cents < dollars * 100) {
        return B.toast('Not enough credit. You have ' + G.money(G.me.balance_cents) + '.', '/wallet.html', 'Add credit');
      }
      back.disabled = true;
      try {
        var res = await G.placeBid(p.id, dollars * 100);
        host.querySelector('[data-total]').textContent = G.money(res.total_cents);
        var fresh = await G.fansOf(p.id, 100);
        document.getElementById('fanlist').innerHTML = fanRows(fresh);
        host.querySelector('[data-backers]').textContent = G.int(fresh.length);
      } catch (err) { B.toast(err.message); }
      finally { back.disabled = false; }
    });
  }

  function fanRows(fans) {
    if (!fans.length) return '<li class="muted">No backers yet. The first dollar puts you at the top of this list.</li>';
    return fans.map(function (f, i) {
      return '<li><span class="r">#' + (i + 1) + '</span>' +
        '<span class="n">' + G.esc(G.fanName(f.users)) + '</span>' +
        '<span class="v num">' + G.money(f.total_cents) + '</span></li>';
    }).join('');
  }

  function start() { boot().catch(function (e) { G.showError('#person', e); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
