import fs from "node:fs/promises";
import { divarCallTool } from "./divar-mcp-client.mjs";
import { extractDivarAds, unwrapMcpResult } from "../src/normalize-divar.mjs";

const config = JSON.parse(await fs.readFile("config/used-market.json", "utf8"));
const observedAt = new Date().toISOString();
const raw = {
  generated_at: observedAt,
  source: "divar-mcp",
  cities: config.cities,
  searches: [],
};
const listings = [];

for (const entry of config.categories) {
  const args = {
    query: entry.query,
    cities: config.cities,
    pages: 2,
    limit: 30,
    only_photo: true,
  };
  if (entry.category) args.category = entry.category;
  try {
    const result = await divarCallTool("search_ads", args);
    const payload = unwrapMcpResult(result);
    raw.searches.push({
      key: entry.key,
      label: entry.label,
      query: entry.query,
      candidates: payload?.candidates ?? null,
      returned: payload?.returned ?? payload?.items?.length ?? 0,
    });
    listings.push(
      ...extractDivarAds(result, {
        category_key: entry.key,
        category_label: entry.label,
        observed_at: observedAt,
      }),
    );
  } catch (error) {
    raw.searches.push({
      key: entry.key,
      label: entry.label,
      query: entry.query,
      error: String(error),
    });
  }
  await new Promise((resolve) => setTimeout(resolve, 900));
}

const unique = [
  ...new Map(listings.map((listing) => [listing.source_id, listing])).values(),
];
const snapshot = {
  schema_version: 1,
  generated_at: observedAt,
  count: unique.length,
  collection: {
    source: "divar-mcp",
    cities: config.cities,
    searches: raw.searches.length,
    successful_searches: raw.searches.filter((item) => !item.error).length,
  },
  listings: unique,
};

const stamp = observedAt.replaceAll(":", "-").replace(".000Z", "Z");
await fs.mkdir("data/used/snapshots", { recursive: true });
await fs.mkdir("data/used/raw", { recursive: true });
await fs.writeFile(`data/used/raw/${stamp}.json`, JSON.stringify(raw, null, 2));
await fs.writeFile(
  `data/used/snapshots/${stamp}.json`,
  JSON.stringify(snapshot, null, 2),
);
await fs.writeFile("data/used/latest.json", JSON.stringify(snapshot, null, 2));
console.log(
  "used market",
  unique.length,
  "listings from",
  snapshot.collection.successful_searches,
  "searches",
);
