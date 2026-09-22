function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function unwrapMcpResult(result) {
  if (Array.isArray(result?.content)) {
    for (const part of result.content) {
      if (part?.type !== "text" || typeof part.text !== "string") continue;
      try {
        return JSON.parse(part.text);
      } catch {
        return { message: part.text };
      }
    }
  }
  return result;
}

export function normalizeDivarAd(raw = {}, context = {}) {
  return {
    schema_version: 1,
    record_type: "classified",
    source: "divar",
    source_id: String(raw.token || raw.id || ""),
    title: raw.title || raw.name || null,
    url: raw.url || null,
    image: raw.thumbnail || raw.image || null,
    price: numberOrNull(raw.price_toman),
    price_is_placeholder: Boolean(raw.price_is_placeholder),
    price_note: raw.price_note || null,
    negotiable: Boolean(raw.negotiable),
    city: raw.city || null,
    district: raw.district || null,
    image_count: numberOrNull(raw.image_count),
    has_chat: raw.has_chat ?? null,
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    time_ago: raw.time_ago || null,
    category_key: context.category_key || null,
    category_label: context.category_label || null,
    observed_at: context.observed_at || new Date().toISOString(),
  };
}

export function extractDivarAds(result, context = {}) {
  const payload = unwrapMcpResult(result);
  return (Array.isArray(payload?.items) ? payload.items : [])
    .map((item) => normalizeDivarAd(item, context))
    .filter((item) => item.source_id && item.title && item.url);
}
