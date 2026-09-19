function num(v){const n=Number(v);return Number.isFinite(n)?n:null}
function first(...v){return v.find(x=>x!==undefined&&x!==null&&x!=="")??null}
export function normalizeProduct(raw={},ctx={}){
 const p=raw.product||raw;
 const price=first(p.price?.selling_price,p.default_variant?.price?.selling_price,p.selling_price,p.price);
 const list=first(p.price?.rrp_price,p.default_variant?.price?.rrp_price,p.rrp_price);
 return {schema_version:1,source:"digikala",source_id:String(first(p.id,p.product_id,p.dkp)||""),title:first(p.title_fa,p.title,p.name),url:first(p.url?.uri,p.url,p.link),image:first(p.images?.main?.url?.[0],p.image,p.image_url),brand:first(p.brand?.title_fa,p.brand?.title,p.brand),category_key:ctx.category_key||null,category_label:ctx.category_label||null,observed_at:ctx.observed_at||new Date().toISOString(),price:num(price),list_price:num(list),discount_percent:num(first(p.price?.discount_percent,p.default_variant?.price?.discount_percent,p.discount_percent)),rating:num(first(p.rating?.rate,p.rating,p.rate)),rating_count:num(first(p.rating?.count,p.rating_count,p.comments_count)),seller:first(p.default_variant?.seller?.title,p.seller?.title,p.seller),rank:num(first(p.rank,p.position,ctx.rank)),available:first(p.status,p.available,p.default_variant?.status)!=="out_of_stock",raw_ref:{query:ctx.query||null}};
}
export function extractProducts(result,ctx={}){
 const candidates=[result?.products,result?.data?.products,result?.content?.products,result?.result?.products,result?.items,result?.data?.items];
 const arr=candidates.find(Array.isArray)||[];
 return arr.map((p,i)=>normalizeProduct(p,{...ctx,rank:i+1})).filter(p=>p.source_id||p.title);
}