# Data model v1

Radar Iran keeps **raw source payloads** separate from normalized observations.

A normalized product observation includes source/source_id, Persian title, URL/image, brand, Radar category, observation timestamp, selling/list price, discount, rating/count, seller, observed rank, availability and minimal provenance.

Derived signals live under `signals`. V1 supports price change, rank change and first-seen detection. These are marketplace observations, not claims of nationwide sales or demand.

## Storage
- `data/raw/`: source payloads for debugging/schema drift
- `data/products/snapshots/`: immutable normalized observations
- `data/products/latest.json`: latest normalized view

The schema is designed so additional marketplaces can be added later.
