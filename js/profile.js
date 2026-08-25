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
          ? 'Your votes are already counted. Sign in so your name and face show up on the cards you back.'
          : 'Signing in keeps your balance and your place on the fan boards.'}
      </p>

      <button id="pf-google" class="btn-google">
        <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M45 24.5c0-1.6-.1-2.8-.4-4H24v7.6h12c-.2 2-1.5 5-4.4 7l6.8 5.3c4-3.7 6.6-9.2 6.6-15.9Z"/><path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-6.8-5.3c-1.9 1.3-4.4 2.2-7.7 2.2-5.9 0-10.9-3.9-12.7-9.2l-7 5.4C7.9 41 15.4 46 24 46Z"/><path fill="#FBBC05" d="M11.3 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .7-4.4l-7-5.4C2.8 17.1 2 20.4 2 24s.8 6.9 2.2 9.8l7.1-5.4Z"/><path fill="#EA4335" d="M24 10.2c3.3 0 5.6 1.4 6.9 2.6l5.9-5.8C33.2 3.7 28.2 2 24 2 15.4 2 7.9 7 4.2 14.2l7 5.4C13 14.2 18.1 10.2 24 10.2Z"/></svg>
        Continue with Google
      </button>
      <div class="or-line"><span>or</span></div>

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

  // Supabase's built-in email sender is rate limited hard (a couple of messages
  // an hour on the default setup). Say what happened and what to do about it,
  // rather than showing the raw error.
  function explainSignIn(e){
    const m = (e && e.message) || '';
    if(/rate limit|too many requests|over_email_send_rate_limit/i.test(m)){
      return 'Email limit reached — that is the built-in Supabase sender, not you. '
           + 'Use <b>Continue with Google</b> above, or wait an hour. '
           + '<span class="mono" style="font-size:11px">To lift it for good, set up SMTP in Supabase → Project Settings → Authentication → SMTP.</span>';
    }
    if(/provider is not enabled|Unsupported provider/i.test(m)){
      return 'That sign-in method is switched off for this project. Enable it in Supabase → Authentication → Sign In / Providers.';
    }
    if(/redirect|not allowed/i.test(m)){
      return 'This site is not on the allowed redirect list. Add it in Supabase → Authentication → URL Configuration.';
    }
    return esc(m || 'Could not sign you in');
  }

  function wireSignIn(el){
    const msg = el.querySelector('#pf-msg');
    const g = el.querySelector('#pf-google');
    if(g) g.addEventListener('click', async ()=>{
      show(msg,'Opening Google…');
      try{
        const { error } = await sb.auth.signInWithOAuth({
          provider:'google',
          options:{ redirectTo: new URL('account.html', location.href).href }
        });
        if(error) throw error;
      }catch(e){ show(msg, explainSignIn(e), 'error'); }
    });
    el.querySelector('#pf-send').addEventListener('click', async ()=>{
      const email = el.querySelector('#pf-email').value.trim();
      if(!/^\S+@\S+\.\S+$/.test(email)){ show(msg,'Enter a valid email.','error'); return; }
      show(msg,'Sending…');
      try{
        const user = await S.currentUser();
        // Always send the link back to THIS deployment. Without an explicit
        // redirect, Supabase falls back to the project's Site URL — which is
        // how magic links end up pointing at localhost in production.
        const redirect = new URL('account.html', location.href).href;
        // An anonymous voter is upgraded in place: same auth user, same votes.
        const { error } = user
          ? await sb.auth.updateUser({ email }, { emailRedirectTo: redirect })
          : await sb.auth.signInWithOtp({ email, options:{ emailRedirectTo: redirect } });
        if(error) throw error;
        show(msg, `Check <b>${esc(email)}</b> for the link. Your votes are already safe.`
          + (/^https?:\/\/(localhost|127\.)/.test(redirect)
             ? ''
             : `<br><span class="mono" style="font-size:11px;color:var(--muted)">The link returns to ${esc(location.host)}.</span>`), 'ok');
      }catch(e){ show(msg, explainSignIn(e), 'error'); }
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

  // ---- the nudge, after money changes hands ----
  // Not after voting: anyone can vote anonymously and that stays true. But once
  // someone has actually paid, they have a balance worth protecting and a face
  // worth putting on the cards they back — so that is where we ask.
  let shown = false;
  async function facePrompt(){
    if(shown) return;
    const st = await S.claimState();
    if(!st.needs) return;                       // already signed in with a card
    shown = true;
    const signin = st.reason === 'signin';
    const t = document.createElement('div');
    t.className = 'claim-toast';
    t.innerHTML = `
      <div>
        <b>${signin ? 'Want your face on the card?' : 'Finish your card'}</b>
        <span>${signin
          ? 'Sign in and your name and photo go on every board you back.'
          : st.reason === 'name'
            ? 'Add a name, or you show up as “Anonymous”.'
            : 'Add a photo — that is what appears next to the person you back.'}</span>
      </div>
      <a href="account.html" class="btn-primary">${signin ? 'Sign in' : 'Set it up'}</a>
      <button class="claim-x" aria-label="Dismiss">×</button>`;
    document.body.appendChild(t);
    t.querySelector('.claim-x').addEventListener('click', ()=>t.remove());
    setTimeout(()=>t.classList.add('in'), 20);
    setTimeout(()=>t.remove(), 20000);
  }

  window.GOATProfile = { mount, facePrompt };
})();
