// js/session.js — vote first, identify later.
//
// The spec calls for a cookie UUID row that gets merged on sign-in. We use
// Supabase anonymous auth instead: it issues a real JWT, so the anonymous voter
// already has a users row of their own and RLS still applies. Signing in later
// upgrades that SAME auth user by adding an email, so votes are never moved
// between rows and there is no merge step to get wrong.
// Requires "Allow anonymous sign-ins" in Supabase Auth settings.
(function(){
  const sb = window.supabaseClient;
  let cachedProfile = null;

  async function currentUser(){
    const { data:{ user } } = await sb.auth.getUser();
    return user || null;
  }

  // Called right before the first spend. Creates an anonymous identity if needed.
  async function ensureVoter(){
    let user = await currentUser();
    if(!user){
      const { data, error } = await sb.auth.signInAnonymously();
      if(error) throw new Error(explainAuth(error));
      user = data.user;
    }
    await ensureRow(user);
    return user;
  }

  async function ensureRow(user){
    const { data } = await sb.from('users').select('*').eq('id', user.id).maybeSingle();
    if(data){ cachedProfile = data; return data; }
    const insert = {
      id: user.id,
      email: user.email || null,
      display_name: user.user_metadata?.display_name || (user.email ? user.email.split('@')[0] : null),
      is_anonymous: !user.email
    };
    const { data: made } = await sb.from('users').insert(insert).select('*').maybeSingle();
    cachedProfile = made;
    return made;
  }

  async function profile(force){
    if(cachedProfile && !force) return cachedProfile;
    const user = await currentUser();
    if(!user) return null;
    const { data } = await sb.from('users').select('*').eq('id', user.id).maybeSingle();
    cachedProfile = data;
    return data;
  }

  async function balance(force){
    const p = await profile(force);
    return p ? (p.balance_cents || 0) : 0;
  }

  function setLocalBalance(cents){
    if(cachedProfile) cachedProfile.balance_cents = cents;
    paintBalance(cents);
  }

  function paintBalance(cents){
    const n = Math.round((cents||0)/100).toLocaleString();
    document.querySelectorAll('[data-balance]').forEach(el => el.textContent = n);
    const pill = document.getElementById('balance-pill');
    if(pill) pill.innerHTML = `<b>${n} votes</b> <a href="wallet.html">Get votes</a>`;
  }

  // The Sign in link is always in the header. Once there is a real account it
  // becomes the account link instead, labelled with the display name.
  async function paintAccount(){
    const el = document.getElementById('account-link');
    if(!el) return;
    const user = await currentUser();
    if(!user || !user.email){ el.textContent = 'Sign in'; el.classList.remove('is-in'); return; }
    const me = await profile();
    el.textContent = (me && me.display_name) ? me.display_name : 'Account';
    el.classList.add('is-in');
  }

  async function hasAccount(){
    const user = await currentUser();
    return !!(user && user.email);
  }

  // Has this anonymous voter been asked to claim their spot yet?
  async function isAnonymousVoter(){
    const user = await currentUser();
    return !!user && !user.email;
  }

  // Broader than "anonymous": a signed-in voter with no display name or photo
  // still has a blank card, so they should be asked too. Returns what is
  // missing so the prompt can say the right thing.
  async function claimState(){
    const user = await currentUser();
    if(!user) return { needs:true, reason:'signin' };
    if(!user.email) return { needs:true, reason:'signin' };
    const me = await profile();
    if(!me || !me.display_name) return { needs:true, reason:'name' };
    if(!me.photo_path) return { needs:true, reason:'photo' };
    return { needs:false };
  }

  // Anonymous sign-in has to be switched on in the Supabase dashboard. If it is
  // not, say so plainly instead of surfacing a raw auth error.
  function explainAuth(err){
    const m = (err && err.message) || '';
    if(/anonymous.*(disabled|not enabled)|signups not allowed/i.test(m)){
      return 'Anonymous voting is switched off for this project. Enable "Allow anonymous sign-ins" in Supabase → Authentication → Sign In / Providers, or sign in from the wallet first.';
    }
    return m || 'Could not start a session';
  }

  async function refresh(){ paintBalance(await balance(true)); await paintAccount(); }

  document.addEventListener('DOMContentLoaded', () => { refresh().catch(()=>paintBalance(0)); });
  sb.auth.onAuthStateChange(() => { cachedProfile = null; refresh().catch(()=>{}); });

  window.GOATSession = { currentUser, ensureVoter, ensureRow, profile, balance,
                         setLocalBalance, paintBalance, paintAccount, hasAccount, isAnonymousVoter, claimState,
                         explainAuth, refresh };
})();
