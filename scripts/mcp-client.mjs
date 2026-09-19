const ENDPOINT=process.env.DIGIKALA_MCP_URL||"https://digikala-mcp.mmdju.workers.dev/mcp";
let id=0;
export async function rpc(method,params={}){
 const r=await fetch(ENDPOINT,{method:"POST",headers:{"content-type":"application/json","accept":"application/json, text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:++id,method,params})});
 if(!r.ok) throw new Error("MCP HTTP "+r.status);
 const text=await r.text(); const lines=text.split("\n").filter(x=>x.startsWith("data:")).map(x=>x.slice(5).trim());
 const payload=lines.length?JSON.parse(lines.at(-1)):JSON.parse(text);
 if(payload.error) throw new Error(JSON.stringify(payload.error)); return payload.result;
}
export async function callTool(name,args={}){return rpc("tools/call",{name,arguments:args});}