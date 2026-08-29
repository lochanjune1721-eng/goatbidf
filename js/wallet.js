/* GOAT.lol — sign-in, top-ups, profile, history.
 * Balance only ever changes on the webhook, never on this page. */
(function () {
  'use strict';
  var G = window.G;
  var $ = function (s) { return document.querySelector(s); };
  var chosen = 1000;

  $('#amounts').innerHTML = G.TOPUPS.map(function (c) {
    return '<button type="button" data-amt="' + c + '" aria-pressed="' + (c === chosen) + '">' + G.money(c) + '</button>';
  }).join('');

  $('#amounts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-amt]');
    if (!b) return;
    chosen = parseInt(b.getAttribute('data-amt'), 10);
    Array.prototype.forEach.call($('#amounts').children, function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
  });

  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var err = $('#login-error');
    err.classList.add('hide');
    var btn = $('#send');
    btn.disabled = true; btn.textContent = 'Sending';
    try {
      await G.signIn($('#email').value.trim());
      $('#login-form').innerHTML =
        '<div class="notice notice-good">Check your inbox. The link signs you straight in.</div>';
    } catch (e2) {
      err.textContent = e2.message; err.classList.remove('hide');
      btn.disabled = false; btn.textContent = 'Send the link';
    }
  });

  $('#topup').addEventListener('click', async function () {
    var err = $('#pay-error');
    err.classList.add('hide');
    this.disabled = true;
    var label = this.textContent;
    this.textContent = 'Opening checkout';
    try {
      var s = await G.sb.auth.getSession();
      var r = await G.api('/api/checkout', { amount_cents: chosen, token: s.data.session.access_token });
      window.location.href = r.url;
    } catch (e) {
      err.textContent = e.message; err.classList.remove('hide');
      this.disabled = false; this.textContent = label;
    }
  });

  $('#save-profile').addEventListener('click', async function () {
    var note = $('#profile-note');
    try {
      await G.setProfile($('#dname').value.trim(), $('#anon').checked);
      note.textContent = 'Saved.';
    } catch (e) { note.textContent = e.message; }
    setTimeout(function () { note.textContent = ''; }, 4000);
  });

  $('#signout').addEventListener('click', async function () {
    await G.signOut();
    window.location.href = '/';
  });

  async function history() {
    var body = $('#history');
    var s = await G.sb.auth.getSession();
    if (!s.data.session) return;
    var uid = s.data.session.user.id;

    var bids = await G.sb.from('bids')
      .select('amount_cents,created_at,people(slug,name)')
      .eq('user_id', uid).order('created_at', { ascending: false }).limit(200);
    var tops = await G.sb.from('topups')
      .select('amount_cents,created_at,status')
      .order('created_at', { ascending: false }).limit(200);

    var rows = []
      .concat((bids.data || []).map(function (b) {
        return {
          when: b.created_at, sign: '−',
          what: 'Backed <a href="/person.html?slug=' + G.esc(b.people ? b.people.slug : '') + '">' +
                G.esc(b.people ? b.people.name : 'someone') + '</a>',
          amount: b.amount_cents
        };
      }))
      .concat((tops.data || []).map(function (t) {
        return {
          when: t.created_at, sign: t.status === 'confirmed' ? '+' : '',
          what: 'Credit added' + (t.status !== 'confirmed' ? ' <span class="muted">(' + G.esc(t.status) + ')</span>' : ''),
          amount: t.amount_cents
        };
      }))
      .sort(function (a, b) { return Date.parse(b.when) - Date.parse(a.when); });

    body.innerHTML = rows.length
      ? rows.map(function (r) {
          return '<tr><td>' + r.what + '</td><td class="n">' + r.sign + G.money(r.amount) + '</td>' +
                 '<td class="muted">' + G.esc(G.ago(r.when)) + '</td></tr>';
        }).join('')
      : '<tr><td colspan="3" class="muted">Nothing yet.</td></tr>';
  }

  G.onMe(function (me) {
    if (me) {
      $('#signed-out').classList.add('hide');
      $('#signed-in').classList.remove('hide');
      $('#bal').textContent = G.money(me.balance_cents);
      if (document.activeElement !== $('#dname')) $('#dname').value = me.display_name || '';
      $('#anon').checked = !!me.is_anonymous;
      history();
    } else {
      $('#signed-out').classList.remove('hide');
      $('#signed-in').classList.add('hide');
    }
  });
})();
