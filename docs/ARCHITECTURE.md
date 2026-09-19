# Architecture

Radar Iran is source-agnostic market intelligence. Digikala MCP is the first source, not the product boundary.

Pipeline: **Sources → snapshots → normalization → intelligence → public JSON → UI/channels**.

## Planned signals
Price Momentum · Trend Score · Value Score · Brand Momentum · Review Signals.

## Principles
- preserve historical observations
- keep source adapters replaceable
- never treat marketplace rank as ground truth demand
- expose provenance and collection time
- rate-limit collection and fail gracefully
