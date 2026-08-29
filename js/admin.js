/* GOAT.lol — the manual review pass. Auto-fetch gives roughly 60% usable
 * photos and some odd name choices, so this is where a board stops looking
 * scraped: swap bad photos, delete wrong entries, add obvious missing names. */
(function () {
  'use strict';
  var G = window.G;
  var $ = function (s) { return document.querySelector(s); };
  var token = null, slug = null;
  try { token = sessionStorage.getItem('goat_admin'); } catch (e) {}

  $('#login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    $('#login-error').classList.add('hide');
    try {
      var r = await G.api('/api/admin', { action: 'login', password: $('#pw').value });
      token = r.token;
      try { sessionStorage.setItem('goat_admin', token); } catch (e2) {}
      open();
    } catch (e3) {
      $('#login-error').textContent = e3.message;
      $('#login-error').classList.remove('hide');
    }
  });

  async function open() {
    $('#login').classList.add('hide');
    $('#panel').classList.remove('hide');
    refreshProgress();
    var cats = await G.categories();
    $('#cat').innerHTML = '<option value="">Pick a board</option>' + cats.map(function (c) {
      return '<option value="' + G.esc(c.slug) + '">' + G.esc(c.group_name || '') + ' — ' + G.esc(c.name) + '</option>';
    }).join('');
  }

  $('#cat').addEventListener('change', function () { slug = this.value; load(); });

  $('#img-start').addEventListener('click', async function () {
    $('#img-start').disabled = true;
    $('#img-now').textContent = 'Starting.';
    /* force: a run already in flight is usually older code, and waiting it
       out is the one thing a Start button should not make you do. */
    try {
      await fetch('/api/images', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ force: true }) });
    }
    catch (e) { $('#img-now').textContent = e.message; }
    startWatching();
    poll();
  });

  /* What the Wikimedia resolver decided, and the three things you can do
     about it. An uncertain match is shown here — larger than the site would
     ever render it — precisely so it can be looked at before it goes live. */
  function imageBlock(p) {
    // No column, no block. Offering a verdict on a field the database does not
    // have would just fail on click.
    if (!('image_status' in p)) return '';
    var status = p.image_status || 'pending';
    var colour = { verified: 'var(--gold)', needs_review: '#e8a54a', missing: 'var(--muted)' }[status] || 'var(--muted)';
    var preview = p.wikimedia_thumbnail_url
      ? '<a href="' + G.esc(p.wikimedia_page_url || p.wikimedia_thumbnail_url) + '" target="_blank" rel="noopener noreferrer">' +
          '<img src="' + G.esc(p.wikimedia_thumbnail_url) + '" alt="" width="120" height="120" ' +
          'style="width:120px;height:120px;object-fit:cover;border-radius:6px;border:1px solid var(--line)" ' +
          'loading="lazy" decoding="async"></a>'
      : '<span class="muted" style="font-size:12px">no file</span>';

    return '<div class="field"><label>Wikimedia image ' +
      '<span style="color:' + colour + '">— ' + G.esc(status) + '</span></label>' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' + preview +
        '<div style="flex:1;min-width:0;font-size:12px" class="muted">' +
          (p.wikimedia_file_title ? G.esc(p.wikimedia_file_title) + '<br>' : '') +
          (p.image_license ? 'licence: ' + G.esc(p.image_license) + '<br>' : '') +
          (p.image_author ? 'by ' + G.esc(p.image_author) + '<br>' : '') +
          (p.image_note ? '<b style="color:#e8a54a">' + G.esc(p.image_note) + '</b><br>' : '') +
          '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">' +
            (status === 'verified' ? '' :
              '<button class="btn btn-sm btn-gold" type="button" data-img="verified">Use this</button>') +
            (p.wikimedia_thumbnail_url
              ? '<button class="btn btn-sm" type="button" data-img="missing">Wrong — drop it</button>' : '') +
            '<button class="btn btn-sm" type="button" data-img="pending">Look again</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';
  }

  /* ------------------------------------------------------------------
     WATCHING THE RESOLVER

     The work happens on the server: /api/images resolves what fits in one
     invocation and hands off to a fresh one, until the queue is empty. This
     panel starts it and then just watches. Closing the tab changes nothing —
     that is the point. It also runs on a daily cron, and any visitor to a
     site with unresolved people starts it too.
     ------------------------------------------------------------------ */

  var watching = null;

  function showProgress(p, running, note) {
    var total = (p.verified || 0) + (p.needs_review || 0) + (p.missing || 0) + (p.pending || 0);
    var done = total ? Math.round(((total - (p.pending || 0)) / total) * 100) : 0;
    $('#img-bar').style.width = done + '%';
    $('#img-progress').innerHTML =
      '<b style="color:var(--gold)">' + done + '%</b> · ' +
      'with a picture <b>' + (p.verified || 0) + '</b> · ' +
      'need a look <b>' + (p.needs_review || 0) + '</b> · ' +
      'no free photo <b>' + (p.missing || 0) + '</b> · ' +
      'not tried yet <b>' + (p.pending || 0) + '</b>';

    $('#img-now').textContent =
      p.pending === 0 ? 'Everyone has been looked up.'
      : running ? 'Running on the server. You can close this tab.'
      : note ? note
      : 'Not running. It will start on its own — press the button to start it now.';
    $('#img-start').textContent = p.pending === 0 ? 'Run again' : running ? 'Running…' : 'Start now';
    $('#img-start').disabled = !!running;
  }

  async function poll() {
    try {
      var r = await (await fetch('/api/images')).json();
      if (r.error) { $('#img-progress').textContent = r.error; stopWatching(); return; }
      showProgress(r.progress, r.running, r.note);
      if (r.progress.pending === 0) stopWatching();
    } catch (e) {
      $('#img-now').textContent = e.message;
    }
  }

  function startWatching() {
    if (watching) return;
    watching = setInterval(poll, 4000);
  }
  function stopWatching() { clearInterval(watching); watching = null; }

  async function refreshProgress() {
    await poll();
    startWatching();
  }

  async function load() {
    var host = $('#rows');
    if (!slug) { host.innerHTML = '<p class="muted">Pick a board.</p>'; return; }
    host.innerHTML = '<p class="muted">Loading.</p>';
    try {
      var r = await G.api('/api/admin', { action: 'list', token: token, slug: slug });
      host.innerHTML =
        r.people.map(function (p) {
          return '<div class="row" data-id="' + G.esc(p.id) + '" data-slug="' + G.esc(p.slug || '') + '" style="align-items:flex-start">' +
            G.photo(p, { plain: true, style: 'width:72px', size: 72, priority: 'eager' }) +
            '<div class="row-body">' +
              '<div class="field" style="margin-top:0"><label>Name</label><input data-f="name" value="' + G.esc(p.name || '') + '"></div>' +
              '<div class="field"><label>One line</label><input data-f="blurb" value="' + G.esc(p.blurb || '') + '"></div>' +
              '<div class="field"><label>Photo path <span class="muted">— in the photos bucket, or a full URL</span></label>' +
                '<input data-f="photo_path" value="' + G.esc(p.photo_path || '') + '"></div>' +
              '<div class="field"><label>Photo credit</label><input data-f="photo_credit" value="' + G.esc(p.photo_credit || '') + '"></div>' +
              '<div class="field"><label>Licence</label><input data-f="photo_license" value="' + G.esc(p.photo_license || '') + '"></div>' +
              imageBlock(p) +
              '<div style="margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
                '<button class="btn btn-sm btn-gold" type="button" data-save>Save</button>' +
                (p.total_cents > 0
                  ? '<span class="muted" style="font-size:12px">' + G.money(p.total_cents) + ' backed — permanent, cannot be deleted</span>'
                  : '<button class="btn btn-sm" type="button" data-del>Delete</button>') +
                '<span class="muted" data-note style="font-size:12px"></span>' +
              '</div>' +
            '</div></div>';
        }).join('') +
        '<div class="panel" style="margin-top:16px"><h2>Add a missing name</h2>' +
          '<div class="field"><label>Name</label><input id="new-name"></div>' +
          '<div class="field"><label>Wikipedia URL</label><input id="new-wiki" type="url"></div>' +
          '<div class="field"><label>One line</label><input id="new-blurb"></div>' +
          '<div style="margin-top:12px"><button class="btn btn-gold" type="button" id="new-go">Add at $0</button></div>' +
        '</div>';
    } catch (e) {
      host.innerHTML = '<p class="muted">' + G.esc(e.message) + '</p>';
      if (/token/i.test(e.message)) { try { sessionStorage.removeItem('goat_admin'); } catch (x) {} }
    }
  }

  $('#rows').addEventListener('click', async function (e) {
    var save = e.target.closest('[data-save]');
    var del = e.target.closest('[data-del]');
    var add = e.target.closest('#new-go');
    var img = e.target.closest('[data-img]');

    if (img) {
      var irow = img.closest('.row');
      var inote = irow.querySelector('[data-note]');
      img.disabled = true;
      inote.textContent = 'Saving.';
      try {
        var verdict = img.getAttribute('data-img');
        await G.api('/api/admin', {
          action: 'image', token: token, id: irow.getAttribute('data-id'), verdict: verdict
        });
        /* "Look again" only clears the verdict; the resolve itself is a
           separate call, so ask for it here rather than leaving the row
           pending until the next bulk run. */
        if (verdict === 'pending') {
          var slugAttr = irow.getAttribute('data-slug');
          if (slugAttr) {
            inote.textContent = 'Searching Wikimedia.';
            try { await G.api('/api/photo', { slug: slugAttr, force: true }); } catch (x) {}
          }
        }
        load();
      } catch (err) {
        inote.textContent = err.message;
        img.disabled = false;
      }
      return;
    }

    if (add) {
      add.disabled = true;
      try {
        await G.api('/api/admin', {
          action: 'add', token: token, slug: slug,
          name: $('#new-name').value, wikipedia_url: $('#new-wiki').value, blurb: $('#new-blurb').value
        });
        load();
      } catch (err) { add.disabled = false; alert(err.message); }
      return;
    }

    var row = e.target.closest('[data-id]');
    if (!row) return;
    var note = row.querySelector('[data-note]');

    if (save) {
      var patch = { action: 'update', token: token, id: row.getAttribute('data-id') };
      Array.prototype.forEach.call(row.querySelectorAll('[data-f]'), function (i) {
        patch[i.getAttribute('data-f')] = i.value;
      });
      try { await G.api('/api/admin', patch); note.textContent = 'Saved.'; }
      catch (err) { note.textContent = err.message; }
      setTimeout(function () { note.textContent = ''; }, 3000);
    }

    if (del) {
      try { await G.api('/api/admin', { action: 'delete', token: token, id: row.getAttribute('data-id') }); row.remove(); }
      catch (err) { note.textContent = err.message; }
    }
  });

  if (token) open();
})();
