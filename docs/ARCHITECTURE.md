# Architecture

Radar Iran is source-agnostic market intelligence. Digikala MCP supplies new retail observations and Divar MCP supplies used-market classified observations; neither source defines the product boundary.

Pipeline: **Sources → snapshots → normalization → intelligence → public JSON → UI/channels**.

## Planned signals
Price Momentum · Trend Score · Value Score · Brand Momentum · Review Signals.

## Principles
- preserve historical observations
- keep retail products and classified listings in separate datasets because their price, seller and availability semantics differ
- keep source adapters replaceable
- never treat marketplace rank as ground truth demand
- expose provenance and collection time
- rate-limit collection and fail gracefully
