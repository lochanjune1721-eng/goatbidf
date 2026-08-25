// js/board.js — mounts rows, casts votes, reorders in place.
// The whole product is this: tap Vote, the number moves, the board reorders,
// and your face lands next to theirs. No modal, no redirect, no reload.
(function(){
  const sb = window.supabaseClient;
  const V  = window.GOATVote;
  const S  = window.GOATSession;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function Board(container, people, opts){
    this.el = container;
    this.people = people.slice();
    this.opts = opts || {};
    this.rows = new Map();      // person id -> element
    this.sort();
    this.mount();
  }

  Board.prototype.sort = function(){
    this.people.sort((a,b) =>
      (b.total_cents||0) - (a.total_cents||0) ||
      (new Date(a.first_backed_at||8.64e15) - new Date(b.first_backed_at||8.64e15)));
  };

  Board.prototype.mount = function(){
    this.el.innerHTML = '';
    this.rows.clear();
    if(!this.people.length){
      this.el.innerHTML = `<div class="empty"><b>No one on this board yet.</b><br>1 vote takes #1.</div>`;
      return;
    }
    this.people.forEach((p,i) => {
      const row = V.renderRow(p, i+1, this.people);
      this.wire(row, p);
      this.rows.set(p.id, row);
      this.el.appendChild(row);
    });
  };

  // Re-rank in place. FLIP so rows visibly slide to their new position.
  Board.prototype.reorder = function(flashId){
    const first = new Map();
    this.rows.forEach((el,id) => first.set(id, el.getBoundingClientRect().top));
    this.sort();

    this.people.forEach((p,i) => {
      const row = this.rows.get(p.id);
      if(!row) return;
      const rank = i+1;
      row.className = `vrow ${V.rankClass(rank)}`;
      const badge = row.querySelector('.rank-badge');
      if(badge) badge.textContent = '#'+rank;
      const count = row.querySelector('[data-count]');
      if(count) count.innerHTML = `${V.voteNum(p.total_cents)}<span>votes</span>`;
      const gap = row.querySelector('[data-pgap]');
      if(gap) gap.innerHTML = V.personGap(p, rank, this.people);
      this.el.appendChild(row);            // reflow into new DOM order
    });

    if(!reduceMotion){
      this.rows.forEach((el,id) => {
        const before = first.get(id);
        if(before == null) return;
        const delta = before - el.getBoundingClientRect().top;
        if(!delta) return;
        el.style.transition = 'none';
        el.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          el.style.transition = '';
          el.style.transform = '';
        });
      });
    }
    if(flashId){
      const row = this.rows.get(flashId);
      if(row && !reduceMotion){ row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); }
    }
  };

  Board.prototype.wire = function(row, p){
    const self = this;
    const amt = row.querySelector('[data-amt]');
    const stakes = row.querySelector('[data-stakes]');
    const btn = row.querySelector('[data-vote]');

    const read = () => Math.max(1, Math.floor(Number(amt.value) || 0));
    const paint = () => {
      amt.value = read();
      const after = (p.total_cents||0) + read()*100;
      let rank = 1;
      for(const o of self.people){ if(o.id!==p.id && (o.total_cents||0) > after) rank++; }
      stakes.textContent = `takes ${p.name} to ${V.voteNum(after)} — #${rank}`;
    };
    row.querySelector('[data-dec]').addEventListener('click', ()=>{ amt.value = Math.max(1, read()-1); paint(); });
    row.querySelector('[data-inc]').addEventListener('click', ()=>{ amt.value = read()+1; paint(); });
    amt.addEventListener('input', paint);
    amt.addEventListener('blur', paint);
    paint();

    btn.addEventListener('click', async () => {
      const votes = read();
      btn.disabled = true;
      const label = btn.textContent; btn.textContent = 'Voting…';

      // ---- optimistic: move the number and the board immediately ----
      const before = p.total_cents || 0;
      p.total_cents = before + votes*100;
      self.reorder(p.id);

      try{
        await S.ensureVoter();
        const { data, error } = await sb.rpc('place_vote', { p_person_id: p.id, p_votes: votes });
        if(error) throw error;

        // reconcile with the server's numbers
        p.total_cents = data.new_total;
        S.setLocalBalance(data.balance);
        await self.onVoted(p, data, row);
        self.reorder(p.id);
      }catch(e){
        p.total_cents = before;                   // roll back
        self.reorder(p.id);
        self.say(row, self.explain(e));
      }finally{
        btn.disabled = false; btn.textContent = label;
      }
    });
  };

  Board.prototype.explain = function(e){
    const m = (e && e.message) || 'Something went wrong';
    if(/Not enough votes|insufficient/i.test(m)) return 'Not enough votes — <a href="wallet.html">get more</a>';
    if(/No account|Not signed in/i.test(m))      return '<a href="wallet.html">Get votes to start</a>';
    return m;
  };

  Board.prototype.say = function(row, html){
    const s = row.querySelector('[data-stakes]');
    if(!s) return;
    s.innerHTML = `<span style="color:#fecaca">${html}</span>`;
    setTimeout(()=>{ const ev=new Event('blur'); row.querySelector('[data-amt]').dispatchEvent(ev); }, 4000);
  };

  // After a successful vote: if the voter is now the GOAT fan, put their face on the card.
  Board.prototype.onVoted = async function(p, data, row){
    const me = await S.profile(true);
    if(!me) return;
    const mine = data.fan_total || 0;
    const leaderCents = p.fan_id === me.id ? mine : (p.fan_cents || 0);
    if(mine >= leaderCents){
      const wasSomeoneElse = p.fan_id && p.fan_id !== me.id;
      p.fan_runner_up_cents = wasSomeoneElse ? p.fan_cents : p.fan_runner_up_cents;
      p.fan_id = me.id;
      p.fan_cents = mine;
      p.fan_name = me.display_name;
      p.fan_anonymous = me.is_anonymous;
      p.fan_photo = me.photo_path;
      p.fan_handle = me.social_handle;
      p.fan_platform = me.social_platform;
      p.fan_photo_status = me.photo_status;
    }else if(p.fan_id === me.id){
      p.fan_cents = mine;
    }
    const half = row.querySelector('.vfan');
    if(half){
      const rank = this.people.findIndex(x=>x.id===p.id)+1;
      half.outerHTML = V.fanHalf(p, rank);
    }
    // No sign-in nag here. Voting stays anonymous-friendly; the ask happens
    // after someone pays (see wallet.html).
    if(this.opts.onVoted) this.opts.onVoted(p, data);
  };

  // where the voter now sits on this person's fan board
  Board.prototype.myFanRank = async function(p, userId){
    try{
      const { data } = await sb.from('fan_totals')
        .select('user_id,total_cents').eq('person_id', p.id)
        .order('total_cents',{ascending:false}).limit(50);
      const i = (data||[]).findIndex(f=>f.user_id===userId);
      return i >= 0 ? i+1 : null;
    }catch(e){ return null; }
  };

  // ---- realtime ----
  // Votes land continuously, so every open board has to move without a reload.
  // Two rules keep that cheap: apply the row from the event payload rather than
  // refetching the board, and coalesce to at most one reorder per 500ms so a
  // burst of votes cannot thrash the layout.
  Board.prototype.live = function(categoryId){
    const self = this;
    let dirty = false, timer = null, flashId = null;

    const schedule = (id) => {
      if(id) flashId = id;
      if(dirty) return;                       // a repaint is already queued
      dirty = true;
      timer = setTimeout(() => {
        dirty = false;
        const f = flashId; flashId = null;
        self.reorder(f);
      }, 500);
    };

    const applyRow = (row) => {
      if(!row || !row.id) return false;
      const p = self.people.find(x => x.id === row.id);
      if(!p) return false;                    // not on this board
      if(row.total_cents === p.total_cents) return false;
      p.total_cents = row.total_cents;
      p.backer_count = row.backer_count ?? p.backer_count;
      p.first_backed_at = row.first_backed_at ?? p.first_backed_at;
      return true;
    };

    try{
      const filter = categoryId ? `category_id=eq.${categoryId}` : undefined;
      const ch = sb.channel('board-' + (categoryId || Math.random().toString(36).slice(2)));

      ch.on('postgres_changes',
        { event:'UPDATE', schema:'public', table:'people', ...(filter?{filter}:{}) },
        payload => { if(applyRow(payload.new)) schedule(payload.new.id); });

      // someone added a contender — that row is not in memory, so refetch once
      ch.on('postgres_changes',
        { event:'INSERT', schema:'public', table:'people', ...(filter?{filter}:{}) },
        () => { self.refresh().catch(()=>{}); });

      // the GOAT fan can change without the person's total changing on this
      // client's copy, so refresh the halves on a throttle too
      ch.on('postgres_changes',
        { event:'*', schema:'public', table:'fan_totals' },
        () => { self.refreshFans(); });

      ch.subscribe();
      this._channel = ch;
    }catch(e){}
    return this;
  };

  // Reload just the fan halves, coalesced. Cheaper than rebuilding rows.
  Board.prototype.refreshFans = function(){
    if(this._fanTimer) return;
    this._fanTimer = setTimeout(async () => {
      this._fanTimer = null;
      if(!this.opts.reload) return;
      try{
        const fresh = await this.opts.reload();
        const byId = new Map(fresh.map(p => [p.id, p]));
        this.people.forEach((p, i) => {
          const f = byId.get(p.id);
          if(!f) return;
          const changed = f.fan_id !== p.fan_id || f.fan_cents !== p.fan_cents;
          Object.assign(p, f);
          if(changed){
            const row = this.rows.get(p.id);
            const half = row && row.querySelector('.vfan');
            if(half) half.outerHTML = V.fanHalf(p, i + 1);
          }
        });
      }catch(e){}
    }, 1500);
  };

  Board.prototype.refresh = async function(){
    if(!this.opts.reload) return;
    const fresh = await this.opts.reload();
    if(!fresh || !fresh.length) return;
    const known = new Set(this.people.map(p => p.id));
    const added = fresh.filter(p => !known.has(p.id));
    const byId = new Map(fresh.map(p=>[p.id,p]));
    let changed = added.length > 0;
    this.people.forEach(p => {
      const f = byId.get(p.id);
      if(f && f.total_cents !== p.total_cents){ Object.assign(p, f); changed = true; }
    });
    if(added.length){ this.people.push(...added); this.mount(); return; }
    if(changed) this.reorder();
  };

  window.GOATBoard = Board;
})();
