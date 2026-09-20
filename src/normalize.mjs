function num(v){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null}
function first(...v){return v.find(x=>x!==undefined&&x!==null&&x!=="")??null}
function unwrap(result){
 if(Array.isArray(result?.content)){
  for(const part of result.content){if(part?.type==="text"&&typeof part.text==="string"){try{return JSON.parse(part.text)}catch{}}}
 }
 return result;
}
export function normalizeProduct(raw={},ctx={}){
 const p=raw.product||raw;
 return {schema_version:1,source:"digikala",source_id:String(first(p.id,p.product_id,p.dkp)||""),title:first(p.title_fa,p.title,p.name),url:first(p.url?.uri,p.url,p.link),image:first(p.images?.main?.url?.[0],p.image,p.image_url),brand:first(p.brand?.title_fa,p.brand?.title,p.brand),category_key:ctx.category_key||null,category_label:ctx.category_label||null,observed_at:ctx.observed_at||new Date().toISOString(),price:num(first(p.price_toman,p.price?.selling_price,p.default_variant?.price?.selling_price,p.selling_price,p.price)),list_price:num(first(p.price_before_toman,p.price?.rrp_price,p.default_variant?.price?.rrp_price,p.rrp_price)),discount_percent:num(first(p.discount_percent,p.price?.discount_percent,p.default_variant?.price?.discount_percent)),rating:num(first(p.rating_stars,p.rating?.rate,p.rating,p.rate)),rating_count:num(first(p.rating_count,p.rating?.count,p.comments_count)),seller:first(p.seller,p.default_variant?.seller?.title,p.seller?.title),rank:num(first(p.rank,p.position,ctx.rank)),available:first(p.in_stock,p.status,p.available,p.default_variant?.status)!==false&&first(p.status,p.default_variant?.status)!=="out_of_stock",badges:Array.isArray(p.badges)?p.badges:[],raw_ref:{query:ctx.query||null}};
}
export function extractProducts(result,ctx={}){
 const r=unwrap(result); const candidates=[r?.items,r?.products,r?.data?.products,r?.content?.products,r?.result?.products,r?.data?.items];
 const arr=candidates.find(Array.isArray)||[];
 return arr.map((p,i)=>normalizeProduct(p,{...ctx,rank:i+1})).filter(p=>p.source_id||p.title);
}