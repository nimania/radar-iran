import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile("dist/index.html", "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error("inline script not found");
const code = match[1];


function lineBreakCode(src){
  let out="",state="code",esc=false,inClass=false,prevSig="";
  const regexStart=()=>!prevSig||"([{:;,=!?&|+-*%^~<>".includes(prevSig);
  for(let i=0;i<src.length;i++){
    const ch=src[i],nx=src[i+1];
    if(state==="single"||state==="double"){
      out+=ch;
      if(esc){esc=false;continue}
      if(ch==="\\"){esc=true;continue}
      if((state==="single"&&ch==="'")||(state==="double"&&ch==='"'))state="code";
      continue;
    }
    if(state==="regex"){
      out+=ch;
      if(esc){esc=false;continue}
      if(ch==="\\"){esc=true;continue}
      if(ch==="["){inClass=true;continue}
      if(ch==="]"&&inClass){inClass=false;continue}
      if(ch==="/"&&!inClass){state="code";prevSig="/"}
      continue;
    }
    if(state==="lineComment"){out+=ch;if(ch==="\n")state="code";continue}
    if(state==="blockComment"){out+=ch;if(ch==="*"&&nx==="/"){out+=nx;i++;state="code"}continue}
    if(ch==="'" ){state="single";out+=ch;continue}
    if(ch==='"'){state="double";out+=ch;continue}
    if(ch==="/"&&nx==="/"){state="lineComment";out+=ch+nx;i++;continue}
    if(ch==="/"&&nx==="*"){state="blockComment";out+=ch+nx;i++;continue}
    if(ch==="/"&&regexStart()){state="regex";inClass=false;out+=ch;continue}
    out+=ch;
    if(ch===";"||ch==="}")out+="\n";
    if(!/\s/.test(ch))prevSig=ch;
  }
  return out;
}

function scanUnterminated(src){
  let q=null,start=-1,esc=false;
  for(let i=0;i<src.length;i++){
    const ch=src[i];
    if(q){
      if(esc){esc=false;continue}
      if(ch==="\\"){esc=true;continue}
      if(ch===q){q=null;start=-1}
      continue;
    }
    if(ch==="'"||ch==='"'||ch==="`"){q=ch;start=i}
  }
  return q?{quote:q,start,snippet:src.slice(Math.max(0,start-250),Math.min(src.length,start+600))}:null;
}

// Syntax check first.
try { new vm.Script(code, { filename: "dist-inline.js" }); } catch (e) {
  const st=String(e.stack||"").split("\n");
  const caretLine=st.findIndex(x=>x.includes("^"));
  let snippet="";
  if(caretLine>0){
    const caret=st[caretLine].indexOf("^");
    if(caret>=0){const a=Math.max(0,caret-220),b=caret+220;snippet=code.slice(a,caret)+"<<<HERE>>>"+code.slice(caret,b);}
  }
  console.error("INLINE_SYNTAX_ERROR:", e.name, e.message);
  try { new vm.Script(lineBreakCode(code), { filename: "dist-pretty.js" }); } catch (p) {
    const ps=String(p.stack||"").split("\n");
    console.error("PRETTY_ERROR:", ps.slice(0,5).join("\n"));
  }
  if(snippet) console.error("AROUND_ERROR:", snippet); else { const u=scanUnterminated(code); if(u) console.error("UNTERMINATED:",u.quote,u.start,u.snippet); else console.error("TAIL:", code.slice(-1200)); }
  process.exit(2);
}

const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const fake = (id = "") => ({
  id,
  style: {},
  dataset: {},
  value: "",
  textContent: "",
  innerHTML: "",
  parentElement: { querySelectorAll: () => [] },
  classList: { add() {}, remove() {}, toggle() {} },
  querySelector: () => ({ textContent: "" }),
  querySelectorAll: () => [],
  closest: () => null,
});
const elements = new Map([...ids].map((id) => [id, fake(id)]));
const document = {
  documentElement: { dataset: {} },
  querySelectorAll: () => [],
  getElementById: (id) => elements.get(id) || null,
  createElement: () => fake(),
};
const storage = new Map();
const localStorage = {
  getItem: (k) => storage.has(k) ? storage.get(k) : null,
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
};
const location = { hash: "#/" };
const context = vm.createContext({
  console,
  document,
  localStorage,
  location,
  navigator: {},
  matchMedia: () => ({ matches: false }),
  scrollTo() {},
  addEventListener() {},
  alert() {},
  prompt: () => null,
  Notification: undefined,
  Intl,
  Date,
  Math,
  Number,
  String,
  JSON,
  Object,
  Array,
  Set,
  Map,
  URL,
  Blob: class {},
  FileReader: class {},
  setTimeout,
  clearTimeout,
  encodeURIComponent,
  decodeURIComponent,
});
new vm.Script(code, { filename: "dist-inline.js" }).runInContext(context);

for (const view of ["alerts", "daily", "discover", "topics", "market", "used"]) {
  if (!ids.has(view)) throw new Error("missing view #" + view);
  vm.runInContext("go(" + JSON.stringify(view) + ")", context);
}
console.log("built UI smoke test passed");
