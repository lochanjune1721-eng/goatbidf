// js/profile.js — identity, but only ever after the vote.
// Nothing here blocks voting: an anonymous voter already has a balance and a
// users row. This is the "claim your spot on his card" step.
(function(){
  const sb = window.supabaseClient;
  const S  = window.GOATSession;
  const V  = () => window.GOATVote;
  const esc = s => (s==null?'':String(s)).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const PLATFORMS = [['x','X'],['instagram','Instagram'],['tiktok','TikTok'],['youtube','YouTube']];

  async function mount(el){
    if(!el) return;
    const user = await S.currentUser();
    const me   = user ? await S.profile(true) : null;
    const signedIn = !!(user && user.email);

    el.innerHTML = signedIn ? editorHtml(me) : signInHtml(!!user);
    signedIn ? wireEditor(el, me) : wireSignIn(el);
  }

  function signInHtml(hasVotes){
    return `
      <h3 style="margin:0 0 4px;font-size:16px">${hasVotes ? 'Claim your spot' : 'Save your votes'}</h3>
      <p style="font-size:13px;color:var(--muted);margin:0 0 12px">
        ${hasVotes
          ? 'Your votes are already counted. Add an email so your name and face show up on the cards you back.'
          : 'A magic link keeps your balance and your place on the fan boards.'}
      </p>
      <div class="field"><label for="pf-email">Email</label>
        <input id="pf-email" type="email" autocomplete="email" placeholder="you@example.com"></div>
      <button id="pf-send" class="btn-primary">Send magic link →</button>
      <div id="pf-msg" class="notice" style="display:none"></div>`;
  }

  function editorHtml(me){
    const handle = me?.social_handle || '';
    const plat   = (me?.social_platform || 'x').toLowerCase();
    const status = me?.photo_status || 'none';
    return `
      <h3 style="margin:0 0 10px;font-size:16px">Your card</h3>
      <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
        <div class="vfan-photo" style="max-width:76px;width:76px;flex:0 0 auto">
          ${me?.photo_path
            ? window.OptimizedImage.render({photoPath:me.photo_path,name:me.display_name,size:76,priority:'eager'})
            : `<div class="fallback">${esc(window.GOAT.initials(me?.display_name||'?'))}</div>`}
        </div>
        <div style="flex:1;min-width:200px">
          <div class="field"><label for="pf-name">Display name <span style="color:var(--gold)">*</span></label>
            <input id="pf-name" maxlength="40" value="${esc(me?.display_name||'')}" placeholder="How you appear on cards"></div>
          <div class="field"><label for="pf-photo">Photo <span style="color:var(--muted)">(optional)</span></label>
            <input id="pf-photo" type="file" accept="image/png,image/jpeg,image/webp"></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <div class="field" style="flex:0 0 120px"><label for="pf-plat">Platform</label>
              <select id="pf-plat">${PLATFORMS.map(([v,l])=>`<option value="${v}"${v===plat?' selected':''}>${l}</option>`).join('')}</select></div>
            <div class="field" style="flex:1;min-width:150px"><label for="pf-handle">Handle <span style="color:var(--muted)">(optional)</span></label>
              <input id="pf-handle" maxlength="40" value="${esc(handle)}" placeholder="@you"></div>
          </div>
          <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin:4px 0 10px">
            <input type="checkbox" id="pf-anon"${me?.is_anonymous?' checked':''}> Stay anonymous on all boards</label>
          ${status==='pending' ? '<div class="notice" style="font-size:12px">Photo is live and awaiting a quick review.</div>' : ''}
          ${status==='rejected'? '<div class="notice error" style="font-size:12px">That photo was removed. Upload a different one.</div>' : ''}
          <button id="pf-save" class="btn-primary">Save</button>
          <button id="pf-out" class="btn-ghost">Sign out</button>
          <div id="pf-msg" class="notice" style="display:none"></div>
        </div>
      </div>`;
  }

  function wireSignIn(el){
    const msg = el.querySelector('#pf-msg');
    el.querySelector('#pf-send').addEventListener('click', async ()=>{
      const email = el.querySelector('#pf-email').value.trim();
      if(!/^\S+@\S+\.\S+$/.test(email)){ show(msg,'Enter a valid email.','error'); return; }
      show(msg,'Sending…');
      try{
        const user = await S.currentUser();
        // An anonymous voter is upgraded in place: same auth user, same votes.
        const { error } = user
          ? await sb.auth.updateUser({ email })
          : await sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: location.href } });
        if(error) throw error;
        show(msg,'Check your email for the link. Your votes are already safe.','ok');
      }catch(e){ show(msg, esc(e.message), 'error'); }
    });
  }

  function wireEditor(el, me){
    const msg = el.querySelector('#pf-msg');
    el.querySelector('#pf-out').addEventListener('click', async ()=>{ await sb.auth.signOut(); location.reload(); });
    el.querySelector('#pf-save').addEventListener('click', async ()=>{
      const name = el.querySelector('#pf-name').value.trim();
      if(!name){ show(msg,'Display name is required.','error'); return; }
      show(msg,'Saving…');
      try{
        const patch = {
          display_name: name,
          social_handle: el.querySelector('#pf-handle').value.trim() || null,
          social_platform: el.querySelector('#pf-plat').value,
          is_anonymous: el.querySelector('#pf-anon').checked
        };
        const file = el.querySelector('#pf-photo').files[0];
        if(file){
          if(file.size > 5*1024*1024) throw new Error('Photo must be under 5MB.');
          const ext = (file.name.split('.').pop()||'jpg').toLowerCase();
          const path = `${me.id}/${Date.now()}.${ext}`;
          const { error: upErr } = await sb.storage.from('fans').upload(path, file, { upsert:true });
          if(upErr) throw upErr;
          patch.photo_path = `${window.GOAT.SUPABASE_URL}/storage/v1/object/public/fans/${path}`;
          patch.photo_status = 'pending';   // visible immediately, reviewed after
        }
        const { error } = await sb.from('users').update(patch).eq('id', me.id);
        if(error) throw error;
        show(msg,'Saved. Your face is on every card you back.','ok');
        await S.profile(true);
        setTimeout(()=>mount(el), 900);
      }catch(e){ show(msg, esc(e.message), 'error'); }
    });
  }

  function show(el,t,k){ el.innerHTML=t; el.className='notice '+(k||''); el.style.display='block'; }

  // ---- the post-vote nudge ----
  // Called after a successful vote by an anonymous voter. Never blocks anything.
  let shown = false;
  async function claimPrompt(personName, rank){
    if(shown) return;
    const st = await S.claimState();
    if(!st.needs) return;                       // their card is already set up
    shown = true;
    const ask = st.reason === 'signin' ? 'Claim your spot on the card.'
              : st.reason === 'name'   ? 'Add a name so it is you on the card, not "Anonymous".'
                                       : 'Add a photo — your face goes on the card.';
    const cta = st.reason === 'signin' ? 'Claim it' : 'Set it up';
    const t = document.createElement('div');
    t.className = 'claim-toast';
    t.innerHTML = `
      <div>
        <b>You're now ${esc(personName)}'s #${rank} fan.</b>
        <span>${ask}</span>
      </div>
      <a href="wallet.html#who" class="btn-primary">${cta}</a>
      <button class="claim-x" aria-label="Dismiss">×</button>`;
    document.body.appendChild(t);
    t.querySelector('.claim-x').addEventListener('click', ()=>t.remove());
    setTimeout(()=>t.classList.add('in'), 20);
    setTimeout(()=>t.remove(), 15000);
  }

  window.GOATProfile = { mount, claimPrompt };
})();
