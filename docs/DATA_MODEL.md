# Data model v1

Radar Iran keeps **raw source payloads** separate from normalized observations.

A normalized product observation includes source/source_id, Persian title, URL/image, brand, Radar category, observation timestamp, selling/list price, discount, rating/count, seller, observed rank, availability and minimal provenance.

Derived signals live under `signals`. V1 supports price change, rank change and first-seen detection. These are marketplace observations, not claims of nationwide sales or demand.

## Storage
- `data/raw/`: source payloads for debugging/schema drift
- `data/products/snapshots/`: immutable normalized observations
- `data/products/latest.json`: latest normalized view

The schema is designed so additional marketplaces can be added later.

## Used-market observations

Divar classified listings are stored separately under `data/used/`. A listing includes its token, title, URL, image, asking price, placeholder/negotiable flags, city, district, photo/chat metadata, category and observation time. A classified asking price is not treated as a completed transaction, and disappearance from a search page is not treated as proof of sale.
