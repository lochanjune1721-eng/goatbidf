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
      if(error) throw new Error('Could not start a session: ' + error.message);
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

  // Has this anonymous voter been asked to claim their spot yet?
  async function isAnonymousVoter(){
    const user = await currentUser();
    return !!user && !user.email;
  }

  async function refresh(){ paintBalance(await balance(true)); }

  document.addEventListener('DOMContentLoaded', () => { refresh().catch(()=>paintBalance(0)); });
  sb.auth.onAuthStateChange(() => { cachedProfile = null; refresh().catch(()=>{}); });

  window.GOATSession = { currentUser, ensureVoter, ensureRow, profile, balance,
                         setLocalBalance, paintBalance, isAnonymousVoter, refresh };
})();
