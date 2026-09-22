import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { normalizeProduct, extractProducts } from "../src/normalize.mjs";
import { percentChange } from "../src/intelligence.mjs";
import { normalizeDivarAd, extractDivarAds } from "../src/normalize-divar.mjs";
for (const p of [
  "config/categories.json",
  "config/used-market.json",
  "scripts/mcp-client.mjs",
  "scripts/divar-mcp-client.mjs",
  "scripts/collect.mjs",
  "scripts/collect-used.mjs",
  "scripts/build-site.mjs",
  "src/normalize.mjs",
  "src/normalize-divar.mjs",
  "src/intelligence.mjs",
])
  await fs.access(p);
JSON.parse(await fs.readFile("config/categories.json", "utf8"));
JSON.parse(await fs.readFile("config/used-market.json", "utf8"));
const raw = {
  content: [
    {
      type: "text",
      text: JSON.stringify({
        items: [
          {
            id: 123,
            title: "نمونه",
            price_toman: 900,
            price_before_toman: 1000,
            discount_percent: 10,
            rating_stars: 4.2,
            rating_count: 7,
            in_stock: true,
            seller: "فروشنده",
          },
        ],
      }),
    },
  ],
};
const [p] = extractProducts(raw, { rank: 2 });
assert.equal(p.source_id, "123");
assert.equal(p.price, 900);
assert.equal(p.list_price, 1000);
assert.equal(p.rating, 4.2);
assert.equal(p.available, true);
assert.equal(percentChange(90, 100), -10);
console.log("OK");
const usedRaw = {
  content: [
    {
      type: "text",
      text: JSON.stringify({
        items: [
          {
            token: "abc123",
            title: "نمونه دست دوم",
            price_toman: 12000000,
            url: "https://divar.ir/v/abc123",
            city: "نوشهر",
          },
        ],
      }),
    },
  ],
};
const [used] = extractDivarAds(usedRaw, {
  category_key: "test",
  category_label: "آزمایشی",
  observed_at: "2026-09-22T00:00:00Z",
});
assert.equal(used.source, "divar");
assert.equal(used.record_type, "classified");
assert.equal(used.source_id, "abc123");
assert.equal(used.price, 12000000);
assert.equal(normalizeDivarAd({ price_toman: null }).price, null);
console.log("OK");
