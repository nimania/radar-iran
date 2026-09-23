import fs from "node:fs/promises";
import vm from "node:vm";

const html = await fs.readFile("dist/index.html", "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error("inline script not found");
const code = match[1];

// Syntax check first.
try { new vm.Script(code, { filename: "dist-inline.js" }); } catch (e) { console.error("INLINE_SYNTAX_ERROR:", e.name, e.message); process.exit(2); }

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
