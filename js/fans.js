/* GOAT.lol — the global backer leaderboard. */
(function () {
  'use strict';
  var G = window.G;
  async function boot() {
    var host = document.getElementById('fans');
    if (G.OFFLINE) { host.innerHTML = '<li class="muted">' + G.esc(G.offlineMessage()) + '</li>'; return; }
    var rows = await G.topFans(200);
    host.innerHTML = rows.length
      ? rows.map(function (u, i) {
          return '<li><span class="r">#' + (i + 1) + '</span>' +
            '<span class="n">' + G.esc(G.fanName(u)) + '</span>' +
            '<span class="v num">' + G.money(u.total_spent_cents) + '</span></li>';
        }).join('')
      : '<li class="muted">Nobody has backed anyone yet. The first dollar puts you at #1 here too.</li>';
  }
  function start() {
    boot().catch(function (e) {
      var host = document.getElementById('fans');
      host.innerHTML = '<li class="muted">' + G.esc(G.explain(e)) + '</li>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
