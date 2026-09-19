# Radar Iran

**نبض بازار مصرف ایران** — an experimental, source-agnostic market-intelligence project for tracking products, prices, brands and market signals in Iran.

## MVP
The first adapter uses [Digikala MCP](https://github.com/mmdju/digikala-mcp). Radar Iran stores periodic observations so it can eventually derive signals that a one-off marketplace search cannot provide.

### Pipeline
`Digikala MCP → Collector → Historical snapshots → Intelligence → JSON/API → Dashboard / Telegram`

Current bootstrap includes an MCP client, scheduled collector, historical JSON snapshots, RTL static dashboard builder, CI checks, and an architecture ready for additional sources.

## Local
```bash
npm run collect
npm run build
npm run check
```

Open `dist/index.html` after building.

## Roadmap
1. Validate live MCP payloads and normalize product records.
2. Expand category coverage and collect reliable history.
3. Add Price Momentum, Trend Score, Value Score and Brand Momentum.
4. Add product/brand/category pages and charts.
5. Publish the dashboard, then add Telegram alerts and daily reports.

> Experimental project. Digikala MCP uses Digikala's undocumented public web API; upstream schemas and availability can change. Radar Iran is not affiliated with Digikala.
