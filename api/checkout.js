import { createClient } from '@supabase/supabase-js';

// Dodo Payments — top-ups only $5 $10 $25 $50 $100, non-refundable credit
const ALLOWED = [500,1000,2500,5000,10000];

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DODO_API_KEY } = process.env;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:'Supabase not configured'});
  const auth = req.headers.authorization?.replace('Bearer ','');
  // get user from Supabase auth header if present, else allow anon for dev
  const supaAuth = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY||'');
  let userId=null;
  if(auth){
    try{ const {data:{user}}=await supaAuth.auth.getUser(auth); userId=user?.id||null; }catch{}
  }
  // fallback: try to get user via service key + body user_id (dev only)
  const body=typeof req.body==='string'? JSON.parse(req.body||'{}'): req.body;
  const cents=Number(body.amount_cents);
  if(!ALLOWED.includes(cents)) return res.status(400).json({error:'Allowed top-ups: $5, $10, $25, $50, $100'});
  // need authenticated user
  if(!userId){
    // try cookie/session fallback — for now require auth
    return res.status(401).json({error:'Sign in to top up. Email magic-link in wallet.'});
  }

  const supa=createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const {data: topup, error}=await supa.from('topups').insert({user_id: userId, amount_cents: cents, status:'pending'}).select('id').maybeSingle();
  if(error) return res.status(500).json({error:error.message});

  const origin=req.headers.origin || `https://${req.headers.host}`;
  if(!DODO_API_KEY){
    // dev: immediately confirm
    await supa.from('topups').update({status:'confirmed', dodo_payment_id: `fake_${Date.now()}`}).eq('id', topup.id);
    await supa.from('users').update({balance_cents: supa.rpc ? undefined : undefined}).eq('id', userId); // placeholder
    // add balance via direct update (since no webhook)
    const {data: u}=await supa.from('users').select('balance_cents').eq('id', userId).maybeSingle();
    await supa.from('users').update({balance_cents: (u?.balance_cents||0)+cents}).eq('id', userId);
    return res.status(200).json({ok:true, fake:true, topup_id: topup.id});
  }

  try{
    const resp=await fetch('https://api.dodopayments.com/v1/checkout/sessions',{
      method:'POST',
      headers:{'Authorization':`Bearer ${DODO_API_KEY}`,'Content-Type':'application/json'},
      body: JSON.stringify({
        amount_cents: cents, currency:'USD',
        description:`GOAT.lol credit top-up $${(cents/100).toFixed(0)} — non-refundable`,
        success_url:`${origin}/wallet.html?topup=success`,
        cancel_url:`${origin}/wallet.html?topup=cancel`,
        metadata:{user_id: userId, topup_id: topup.id}
      })
    });
    const j=await resp.json().catch(()=>({}));
    if(!resp.ok) throw new Error(j.error||`Dodo ${resp.status}`);
    const url=j.url||j.checkout_url;
    return res.status(200).json({url, topup_id: topup.id});
  }catch(e){ return res.status(500).json({error:e.message}); }
}
