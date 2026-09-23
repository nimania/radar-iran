const JSON_HEADERS={"content-type":"application/json; charset=utf-8"};
const CORS={"access-control-allow-origin":"*","access-control-allow-headers":"authorization, content-type","access-control-allow-methods":"GET,PUT,POST,DELETE,OPTIONS"};
const reply=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{...JSON_HEADERS,...CORS,...extra}});
const b64url=(bytes)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
async function sha256(s){const data=new TextEncoder().encode(s);return b64url(new Uint8Array(await crypto.subtle.digest("SHA-256",data)))}
function bearer(req){const h=req.headers.get("authorization")||"";return h.startsWith("Bearer ")?h.slice(7).trim():""}
async function auth(req,env){const token=bearer(req);if(!token||token.length<24)return null;const tokenHash=await sha256(token);const row=await env.DB.prepare("SELECT id, token_hash, created_at, updated_at FROM profiles WHERE token_hash=?").bind(tokenHash).first();return row?{...row,token}:null}
async function readJson(req){try{return await req.json()}catch{return null}}
function cleanState(x){const state=x&&typeof x==="object"?x:{};return{
  watchlist:Array.isArray(state.watchlist)?state.watchlist.map(String).slice(0,500):[],
  rules:Array.isArray(state.rules)?state.rules.slice(0,500):[],
  compare:Array.isArray(state.compare)?state.compare.map(String).slice(0,3):[]
}}
export default{async fetch(req,env){
  const url=new URL(req.url),path=url.pathname.replace(/\/+$/,"")||"/";
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
  if(path==="/health")return reply({ok:true,service:"radar-iran",version:1});
  if(path==="/v1/profile"&&req.method==="POST"){
    const token=b64url(crypto.getRandomValues(new Uint8Array(32))),tokenHash=await sha256(token),id=crypto.randomUUID(),now=new Date().toISOString();
    await env.DB.prepare("INSERT INTO profiles (id,token_hash,state_json,created_at,updated_at) VALUES (?,?,?,?,?)").bind(id,tokenHash,JSON.stringify(cleanState({})),now,now).run();
    return reply({id,token,created_at:now},201,{"cache-control":"no-store"});
  }
  if(path==="/v1/state"){
    const profile=await auth(req,env);if(!profile)return reply({error:"unauthorized"},401);
    if(req.method==="GET"){
      const row=await env.DB.prepare("SELECT state_json,updated_at FROM profiles WHERE id=?").bind(profile.id).first();
      return reply({id:profile.id,state:cleanState(JSON.parse(row?.state_json||"{}")),updated_at:row?.updated_at||profile.updated_at},200,{"cache-control":"no-store"});
    }
    if(req.method==="PUT"){
      const body=await readJson(req);if(!body)return reply({error:"invalid_json"},400);
      const state=cleanState(body.state??body),now=new Date().toISOString();
      await env.DB.prepare("UPDATE profiles SET state_json=?,updated_at=? WHERE id=?").bind(JSON.stringify(state),now,profile.id).run();
      return reply({ok:true,updated_at:now,state});
    }
  }
  if(path==="/v1/push-subscription"){
    const profile=await auth(req,env);if(!profile)return reply({error:"unauthorized"},401);
    if(req.method==="POST"){
      const body=await readJson(req),sub=body?.subscription;if(!sub?.endpoint)return reply({error:"invalid_subscription"},400);
      const key=await sha256(sub.endpoint),now=new Date().toISOString();
      await env.DB.prepare("INSERT INTO push_subscriptions (profile_id,endpoint_hash,subscription_json,created_at,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(profile_id,endpoint_hash) DO UPDATE SET subscription_json=excluded.subscription_json,updated_at=excluded.updated_at").bind(profile.id,key,JSON.stringify(sub),now,now).run();
      return reply({ok:true});
    }
    if(req.method==="DELETE"){
      const body=await readJson(req),endpoint=body?.endpoint;if(!endpoint)return reply({error:"endpoint_required"},400);
      await env.DB.prepare("DELETE FROM push_subscriptions WHERE profile_id=? AND endpoint_hash=?").bind(profile.id,await sha256(endpoint)).run();
      return reply({ok:true});
    }
  }
  return reply({error:"not_found"},404);
}};
