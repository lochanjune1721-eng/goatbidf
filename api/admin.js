import { createClient } from '@supabase/supabase-js';

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const { ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  const body=typeof req.body==='string'? JSON.parse(req.body||'{}'): req.body;
  const { password, action, id } = body||{};
  if(!ADMIN_PASSWORD) return res.status(500).json({error:'ADMIN_PASSWORD not configured'});
  if(password!==ADMIN_PASSWORD) return res.status(401).json({error:'Unauthorized'});
  if(!action) return res.status(200).json({ok:true});
  if(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({error:'Supabase not configured'});
  const supa=createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 30-min grace: list confirmed donations with no matching payment (donation_confirmed true, payment_confirmed false, created >30m ago)
  if(action==='pending_donations'){
    const cutoff=new Date(Date.now()-30*60*1000).toISOString();
    const {data,error}=await supa.from('entries').select('*').eq('donation_confirmed',true).eq('payment_confirmed',false).lt('last_bid_at', cutoff).order('last_bid_at',{ascending:false}).limit(50);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({entries:data});
  }
  if(action==='approve_donation'){
    if(!id) return res.status(400).json({error:'Missing id'});
    const {error}=await supa.from('entries').update({ status:'live', payment_confirmed:true }).eq('id', id);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({ok:true});
  }
  if(action==='reject'){
    if(!id) return res.status(400).json({error:'Missing id'});
    const {error}=await supa.from('entries').update({ status:'rejected' }).eq('id', id);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({ok:true});
  }
  return res.status(400).json({error:'Unknown action'});
}
