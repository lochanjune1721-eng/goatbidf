// GOAT.lol — Supabase + auth + balance
const SUPABASE_URL = "https://iuvmzlrnbwptgrbkdbbn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dm16bHJuYndwdGdyYmtkYmJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTc3MjksImV4cCI6MjEwMzE3MzcyOX0.sF9FLOHjyEjZr9FGYJAAir_GZg7Pme92T2Kcoba1nrM";
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.GOAT = {
  SUPABASE_URL,
  getPhotoUrl: (path) => {
    if(!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if(!trimmed) return null;
    if(trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }
    // Clean leading slashes
    const cleanPath = trimmed.replace(/^\/+/, '');
    return `${SUPABASE_URL}/storage/v1/object/public/people/${cleanPath}`;
  },
  cents: (c)=> `$${(c/100).toLocaleString()}`,
  // Every dollar is a vote. Money is stored in cents, so 100 cents = 1 vote.
  toVotes: (c)=> Math.round((c||0)/100),
  votes: (c)=> {
    const v = Math.round((c||0)/100);
    return `${v.toLocaleString()} ${v===1?'vote':'votes'}`;
  },
  voteNum: (c)=> Math.round((c||0)/100).toLocaleString(),
  fmtAgo: (iso)=>{
    if(!iso) return "—";
    const s=Math.floor((Date.now()-new Date(iso).getTime())/1000);
    if(s<60) return `${s}s ago`;
    const m=Math.floor(s/60); if(m<60) return `${m} min ago`;
    const h=Math.floor(m/60); if(h<24) return `${h}h ago`;
    const d=Math.floor(h/24); return `${d}d ago`;
  },
  qs: (k)=> new URLSearchParams(location.search).get(k),

  // PostgREST caps a response at max-rows (1000 by default), so .limit(4000)
  // silently returns 1000 and the rest of the list just disappears. fetchAll
  // pages with .range() until the server stops giving rows.
  // `make` must return a FRESH query builder each call — .range() mutates it.
  fetchAll: async (make, opts) => {
    const page = (opts && opts.page) || 1000;
    const cap  = (opts && opts.cap)  || 50000;
    const out = [];
    for(let from = 0; from < cap; from += page){
      const { data, error } = await make().range(from, from + page - 1);
      if(error) throw error;
      if(!data || !data.length) break;
      out.push(...data);
      if(data.length < page) break;       // short page means we reached the end
    }
    return out;
  },
  initials: (name)=> {
    if(!name) return '?';
    const parts = name.trim().split(/\s+/);
    if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }
};

async function ensureUserRow(){
  const {data:{user}}=await window.supabaseClient.auth.getUser();
  if(!user) return null;
  let {data}=await window.supabaseClient.from('users').select('*').eq('id', user.id).maybeSingle();
  if(!data){
    const display = user.user_metadata?.display_name || user.email.split('@')[0];
    const anon = !!user.user_metadata?.is_anonymous;
    const {data: ins}=await window.supabaseClient.from('users').insert({id:user.id, email:user.email, display_name: display, is_anonymous: anon}).select('*').maybeSingle();
    data=ins;
  }
  return data;
}
window.ensureUserRow=ensureUserRow;

// Balance and account state are painted by js/session.js, which owns
// #balance-pill and #account-link. Two painters on one element fought.

