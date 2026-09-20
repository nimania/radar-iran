import fs from "node:fs/promises"; import {callTool} from "./mcp-client.mjs"; import {extractProducts} from "../src/normalize.mjs"; import {enrich} from "../src/intelligence.mjs";
const cfg=JSON.parse(await fs.readFile("config/categories.json","utf8")); const now=new Date().toISOString();
let previous=[]; try{previous=JSON.parse(await fs.readFile("data/products/latest.json","utf8")).products||[]}catch{}
const FULL=process.env.FULL_SCAN==="1"||process.env.GITHUB_EVENT_NAME==="workflow_dispatch";
const BATCH=Math.max(1,Number(process.env.CATEGORY_BATCH||5));
const hour=Math.floor(Date.now()/3600000);
const selected=FULL?cfg.categories:cfg.categories.filter((_,i)=>i%BATCH===hour%BATCH);
const selectedKeys=new Set(selected.map(c=>c.key));
const raw={generated_at:now,source:"digikala-mcp",mode:FULL?"full":"rotating",categories:{}}; let normalized=[];
for(const c of selected){try{const result=await callTool("search_digikala",{query:c.query,limit:20});raw.categories[c.key]={label:c.label,query:c.query,result};normalized.push(...extractProducts(result,{category_key:c.key,category_label:c.label,query:c.query,observed_at:now}))}catch(e){raw.categories[c.key]={label:c.label,error:String(e)}} await new Promise(r=>setTimeout(r,900))}
const untouched=FULL?[]:previous.filter(p=>!selectedKeys.has(p.category_key));
const fresh=[...new Map(normalized.map(p=>[p.source_id||p.title,p])).values()];
const products=enrich(fresh,previous).concat(untouched).sort((a,b)=>(a.category_label||"").localeCompare(b.category_label||"","fa")||(a.rank||999)-(b.rank||999));
const snapshot={schema_version:1,generated_at:now,count:products.length,collection:{mode:FULL?"full":"rotating",categories_scanned:selected.length,categories_total:cfg.categories.length},products};
await fs.mkdir("data/raw",{recursive:true});await fs.mkdir("data/products/snapshots",{recursive:true});const stamp=now.replaceAll(":","-").replace(".000Z","Z");
await fs.writeFile(`data/raw/${stamp}.json`,JSON.stringify(raw,null,2));await fs.writeFile(`data/products/snapshots/${stamp}.json`,JSON.stringify(snapshot,null,2));await fs.writeFile("data/products/latest.json",JSON.stringify(snapshot,null,2));console.log("mode",FULL?"full":"rotating","categories",selected.length+"/"+cfg.categories.length,"products",products.length);