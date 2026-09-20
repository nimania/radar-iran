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
const prevMap=new Map(previous.map(p=>[String(p.source_id),p]));
function unwrapDetail(result){if(Array.isArray(result?.content)){for(const part of result.content){if(part?.type==="text"&&typeof part.text==="string"){try{return JSON.parse(part.text)}catch{}}}}return result}
function imageOf(x){const p=x?.product||x?.data?.product||x?.data||x;const v=p?.images?.main?.url;return Array.isArray(v)?v[0]:(typeof v==="string"?v:(p?.image||p?.image_url||null))}
function brandOf(x){const p=x?.product||x?.data?.product||x?.data||x;return p?.brand?.title_fa||p?.brand?.title||p?.brand||null}
const ENRICH_LIMIT=Math.max(0,Number(process.env.ENRICH_LIMIT||12));let enriched=0;
for(const p of fresh){const old=prevMap.get(String(p.source_id));if(!p.image&&old?.image)p.image=old.image;if(!p.brand&&old?.brand)p.brand=old.brand;if(enriched>=ENRICH_LIMIT||!p.source_id||(p.image&&p.brand))continue;try{const detail=unwrapDetail(await callTool("product_details",{id:Number(p.source_id)}));p.image=p.image||imageOf(detail);p.brand=p.brand||brandOf(detail);enriched++;await new Promise(r=>setTimeout(r,900))}catch(e){raw.categories._enrichment??={};raw.categories._enrichment[p.source_id]=String(e)}}
const products=enrich(fresh,previous).concat(untouched).sort((a,b)=>(a.category_label||"").localeCompare(b.category_label||"","fa")||(a.rank||999)-(b.rank||999));
const snapshot={schema_version:1,generated_at:now,count:products.length,collection:{mode:FULL?"full":"rotating",categories_scanned:selected.length,categories_total:cfg.categories.length},products};
await fs.mkdir("data/raw",{recursive:true});await fs.mkdir("data/products/snapshots",{recursive:true});const stamp=now.replaceAll(":","-").replace(".000Z","Z");
await fs.writeFile(`data/raw/${stamp}.json`,JSON.stringify(raw,null,2));await fs.writeFile(`data/products/snapshots/${stamp}.json`,JSON.stringify(snapshot,null,2));await fs.writeFile("data/products/latest.json",JSON.stringify(snapshot,null,2));console.log("mode",FULL?"full":"rotating","categories",selected.length+"/"+cfg.categories.length,"products",products.length,"details enriched",enriched);