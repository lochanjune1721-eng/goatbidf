// js/vote.js — the row, the vote, the reorder.
// Everything money-shaped is cents internally; VOTES() is the only converter.
(function(){
  const G = window.GOAT;
  const sb = window.supabaseClient;

  const toVotes  = c => Math.round((c||0)/100);
  const voteNum  = c => toVotes(c).toLocaleString();
  const voteWord = c => `${voteNum(c)} ${toVotes(c)===1?'vote':'votes'}`;
  const esc = s => (s==null?'':String(s)).replace(/[&<>"']/g, ch =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const PLATFORM_ICON = {
    x:'<svg viewBox="0 0 24 24"><path d="M18.9 2H22l-7 8 8.2 12h-6.4l-5-7.3L6 22H2.9l7.5-8.6L2.5 2H9l4.5 6.7L18.9 2Z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24"><path d="M12 2c2.7 0 3.1 0 4.1.06 1 .05 1.7.2 2.3.44a4.6 4.6 0 0 1 1.7 1.1 4.6 4.6 0 0 1 1.1 1.7c.24.6.4 1.3.44 2.3.05 1 .06 1.4.06 4.1s0 3.1-.06 4.1c-.05 1-.2 1.7-.44 2.3a4.9 4.9 0 0 1-2.8 2.8c-.6.24-1.3.4-2.3.44-1 .05-1.4.06-4.1.06s-3.1 0-4.1-.06c-1-.05-1.7-.2-2.3-.44a4.9 4.9 0 0 1-2.8-2.8c-.24-.6-.4-1.3-.44-2.3C2.01 15.1 2 14.7 2 12s0-3.1.06-4.1c.05-1 .2-1.7.44-2.3a4.9 4.9 0 0 1 2.8-2.8c.6-.24 1.3-.4 2.3-.44C8.9 2.01 9.3 2 12 2Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.2 7a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4Z"/></svg>',
    tiktok:'<svg viewBox="0 0 24 24"><path d="M16.5 2c.3 2.2 1.6 3.6 3.8 3.8v2.6c-1.3.1-2.5-.2-3.8-1v6.9c0 4.4-4.8 7.2-8.6 4.9-2.5-1.5-3.1-5-1.4-7.3 1.3-1.7 3.4-2.4 5.4-1.9v2.7c-1.7-.4-2.9.5-3.1 1.8-.2 1.4.9 2.6 2.3 2.5 1.3 0 2.2-1 2.2-2.4V2h3.2Z"/></svg>',
    youtube:'<svg viewBox="0 0 24 24"><path d="M23 12s0-3.3-.4-4.9a2.6 2.6 0 0 0-1.8-1.8C19.1 5 12 5 12 5s-7.1 0-8.8.4a2.6 2.6 0 0 0-1.8 1.8C1 8.7 1 12 1 12s0 3.3.4 4.9c.2.9.9 1.6 1.8 1.8 1.7.3 8.8.3 8.8.3s7.1 0 8.8-.4a2.6 2.6 0 0 0 1.8-1.8C23 15.3 23 12 23 12ZM9.8 15.3V8.7l6 3.3-6 3.3Z"/></svg>',
    link:'<svg viewBox="0 0 24 24"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l2.8-2.8a3 3 0 1 1 4.2 4.2l-1.4 1.4-1.4-1.4 1.4-1.4a1 1 0 0 0-1.4-1.4L12 13.4a1 1 0 0 1-1.4 0Zm2.8-2.8a1 1 0 0 1 0 1.4l-2.8 2.8a1 1 0 0 0 1.4 1.4l1.4-1.4 1.4 1.4-1.4 1.4a3 3 0 0 1-4.2-4.2l2.8-2.8a1 1 0 0 1 1.4 0Z"/></svg>'
  };

  function handleUrl(platform, handle){
    const h = String(handle||'').replace(/^@/,'');
    switch((platform||'').toLowerCase()){
      case 'x': case 'twitter':  return 'https://x.com/'+encodeURIComponent(h);
      case 'instagram':          return 'https://instagram.com/'+encodeURIComponent(h);
      case 'tiktok':             return 'https://tiktok.com/@'+encodeURIComponent(h);
      case 'youtube':            return 'https://youtube.com/@'+encodeURIComponent(h);
      default:                   return /^https?:\/\//.test(handle) ? handle : null;
    }
  }

  function rankClass(r){ return r===1?'r1':r===2?'r2':r===3?'r3':r<=10?'r4':'r11'; }
  function photoSize(r){ return r===1?220:r===2?160:r===3?130:r<=10?90:60; }
  function fanSize(r){ return r===1?90:r===2?70:r===3?60:r<=10?44:32; }

  function img(path, name, size, priority){
    return window.OptimizedImage.render({ photoPath:path, name, size, priority });
  }

  // ---- the person's gap line: ahead of #2, or behind the one above ----
  function personGap(p, rank, list){
    if(rank === 1){
      const next = list[1];
      if(!next) return 'Unopposed so far';
      const d = (p.total_cents||0) - (next.total_cents||0);
      return d > 0 ? `<b>${voteNum(d)}</b> votes ahead of #2` : `Level with #2`;
    }
    const above = list[rank-2];
    const d = (above.total_cents||0) - (p.total_cents||0);
    return d > 0 ? `<b>${voteNum(d)}</b> votes behind #${rank-1}` : `Level with #${rank-1}`;
  }

  // ---- right half: the GOAT fan ----
  function fanHalf(p, rank){
    const size = fanSize(rank);
    if(!p.fan_id || !p.fan_cents){
      return `<div class="vfan">
        <div class="vfan-label">GOAT fan</div>
        <div class="vfan-empty"><b>No GOAT fan yet</b>1 vote claims it.</div>
      </div>`;
    }
    const anon = p.fan_anonymous;
    const name = anon ? 'Anonymous' : (p.fan_name || 'Someone');
    const showPhoto = !anon && p.fan_photo && p.fan_photo_status !== 'rejected';
    const lead = p.fan_runner_up_cents != null
      ? (() => { const d=(p.fan_cents||0)-(p.fan_runner_up_cents||0);
                 return d>0 ? `<b>${voteNum(d)}</b> votes ahead of the next fan` : 'Level with the next fan'; })()
      : 'Only fan so far';

    let handleHtml = '';
    if(!anon && p.fan_handle){
      const url = handleUrl(p.fan_platform, p.fan_handle);
      const icon = PLATFORM_ICON[(p.fan_platform||'').toLowerCase()] || PLATFORM_ICON.link;
      const label = `<span>${esc(p.fan_handle.startsWith('@')?p.fan_handle:'@'+p.fan_handle)}</span>`;
      handleHtml = url
        ? `<a class="vfan-handle" href="${esc(url)}" target="_blank" rel="noopener nofollow ugc">${icon}${label}</a>`
        : `<span class="vfan-handle">${icon}${label}</span>`;
    }

    return `<div class="vfan">
      <div class="vfan-label">GOAT fan</div>
      <div class="vfan-photo">${showPhoto ? img(p.fan_photo, name, size, 'lazy')
        : `<div class="fallback">${esc(G.initials(name))}</div>`}</div>
      <div class="vfan-name">${esc(name)}</div>
      ${handleHtml}
      <div class="vfan-count">${voteWord(p.fan_cents)}</div>
      <div class="vgap">${lead}</div>
    </div>`;
  }

  // ---- the whole row ----
  function renderRow(p, rank, list){
    const el = document.createElement('article');
    el.className = `vrow ${rankClass(rank)}`;
    el.dataset.personId = p.id;
    el.innerHTML = `
      <div class="vrow-main">
        <div class="vperson">
          <div class="vphoto">${img(p.photo_path, p.name, photoSize(rank), rank<=2?'eager':'lazy')}</div>
        </div>
        <div class="vmeta">
          <span class="rank-badge">#${rank}</span>
          <h3 class="vname display">${esc(p.name)}</h3>
          ${p.blurb ? `<p class="vblurb">${esc(p.blurb)}</p>` : ''}
          <div class="vcount display" data-count>${voteNum(p.total_cents)}<span>votes</span></div>
          <div class="vgap" data-pgap>${personGap(p, rank, list)}</div>
        </div>
        <div class="vdivider" aria-hidden="true"></div>
        ${fanHalf(p, rank)}
      </div>
      <div class="vrow-actions">
        <span class="vstep">
          <button type="button" data-dec aria-label="One fewer vote">&minus;</button>
          <input type="number" data-amt min="1" step="1" value="1" inputmode="numeric" aria-label="Votes to cast">
          <span class="u">votes</span>
          <button type="button" data-inc aria-label="One more vote">+</button>
        </span>
        <button class="btn-vote" data-vote>Vote</button>
        <span class="vstakes" data-stakes></span>
      </div>`;
    return el;
  }

  // ---- loading a board ----
  // people_with_top_fan gets each contender and their GOAT fan in one query.
  // If the migration hasn't been run yet the view won't exist, and PostgREST
  // answers "Could not find the table ... in the schema cache". Rather than
  // showing an error page, fall back to the plain tables and assemble the same
  // shape client-side. Slower, but the board still renders.
  const MISSING = e => /schema cache|does not exist|not find the table|PGRST205|42P01/i.test(e?.message || '');

  async function loadBoard(sb, categoryId){
    const cols = 'id,slug,category_id,name,blurb,wikipedia_url,photo_path,photo_credit,photo_license,total_cents,backer_count,first_backed_at';

    // preferred path
    const view = await sb.from('people_with_top_fan').select('*')
      .eq('category_id', categoryId)
      .order('total_cents',{ascending:false}).order('first_backed_at',{ascending:true}).limit(300);
    if(!view.error) return { people: view.data || [], degraded: false };
    if(!MISSING(view.error)) throw view.error;

    // fallback: base table, then stitch the fan on
    const base = await sb.from('people').select(cols)
      .eq('category_id', categoryId)
      .order('total_cents',{ascending:false}).order('first_backed_at',{ascending:true}).limit(300);
    if(base.error) throw base.error;
    const people = (base.data || []).map(p => ({ ...p, fan_id:null, fan_cents:null, fan_runner_up_cents:null }));
    if(!people.length) return { people, degraded: true };

    try{
      const ids = people.map(p => p.id);
      const { data: fans, error: fe } = await sb.from('fan_totals')
        .select('person_id,user_id,total_cents').in('person_id', ids)
        .order('total_cents',{ascending:false});
      if(fe) throw fe;

      const top = {};
      for(const f of (fans || [])){
        const slot = top[f.person_id] || (top[f.person_id] = []);
        if(slot.length < 2) slot.push(f);
      }
      const fanIds = Object.values(top).map(v => v[0]?.user_id).filter(Boolean);
      let profiles = {};
      if(fanIds.length){
        // public_profiles is new too; if it is missing, fall back to no names
        const pr = await sb.from('public_profiles').select('*').in('id', fanIds);
        if(!pr.error) profiles = Object.fromEntries((pr.data || []).map(u => [u.id, u]));
      }
      for(const p of people){
        const t = top[p.id];
        if(!t || !t.length) continue;
        const u = profiles[t[0].user_id] || {};
        p.fan_id = t[0].user_id;
        p.fan_cents = t[0].total_cents;
        p.fan_runner_up_cents = t[1] ? t[1].total_cents : null;
        p.fan_name = u.display_name || null;
        p.fan_anonymous = u.is_anonymous ?? true;
        p.fan_photo = u.photo_path || null;
        p.fan_handle = u.social_handle || null;
        p.fan_platform = u.social_platform || null;
        p.fan_photo_status = u.photo_status || null;
      }
    }catch(e){ /* fan data is optional — the board still ranks correctly without it */ }

    return { people, degraded: true };
  }

  window.GOATVote = { toVotes, voteNum, voteWord, esc, renderRow, personGap, fanHalf,
                      rankClass, photoSize, fanSize, handleUrl, PLATFORM_ICON,
                      loadBoard, isMissingRelation: MISSING };
})();
