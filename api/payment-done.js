import { createClient } from '@supabase/supabase-js';

// Dodo webhook — confirm top-up, add to balance. Idempotent on dodo_payment_id.
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DODO_WEBHOOK_SECRET } = process.env;
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:'Supabase not configured'});
  let body; try{ body=typeof req.body==='string'? JSON.parse(req.body||'{}'): req.body; }catch{ body={}; }
  console.log('payment-done', JSON.stringify(body).slice(0,3000));
  const dodoId=body.paymentId||body.payment_id||body.id||body.dodo_payment_id;
  const topupId=body.metadata?.topup_id||body.topup_id;
  const userId=body.metadata?.user_id||body.user_id;
  const amount=body.amount_cents||body.amount||body.total||0;
  const supa=createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  // find topup
  let topup=null;
  if(topupId){
    const {data}=await supa.from('topups').select('*').eq('id', topupId).maybeSingle(); topup=data;
  } else if(dodoId){
    const {data}=await supa.from('topups').select('*').eq('dodo_payment_id', dodoId).maybeSingle(); topup=data;
  }
  // fallback find pending for user
  if(!topup && userId){
    const {data}=await supa.from('topups').select('*').eq('user_id', userId).eq('status','pending').order('created_at',{ascending:false}).limit(1).maybeSingle(); topup=data;
  }
  if(!topup) return res.status(404).json({error:'Topup not found'});
  if(topup.status==='confirmed') return res.status(200).json({received:true, duplicate:true});
  const cents = topup.amount_cents || Math.round(Number(amount));
  // idempotent
  const {error: upErr}=await supa.from('topups').update({status:'confirmed', dodo_payment_id: dodoId||`dodo_${Date.now()}`}).eq('id', topup.id);
  if(upErr && !upErr.message.includes('duplicate')) return res.status(500).json({error:upErr.message});
  // add balance
  const {data: u}=await supa.from('users').select('balance_cents').eq('id', topup.user_id).maybeSingle();
  await supa.from('users').update({balance_cents: (u?.balance_cents||0)+cents}).eq('id', topup.user_id);
  return res.status(200).json({received:true});
}
