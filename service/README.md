# Radar Iran Service Layer

Optional backend for cloud sync. The public site still works without it.

## What it provides

- anonymous sync identity (a random recovery key, treated like a password)
- cloud sync for Watchlist, alert rules and Compare selection
- storage for future Web Push subscriptions
- no email/password account required for this first service-layer iteration

## Cloudflare Workers + D1 deployment

1. Create a D1 database named `radar-iran`.
2. Copy `service/wrangler.toml.example` to `service/wrangler.toml` and set the D1 database ID.
3. Apply the schema:
   ```bash
   npx wrangler d1 execute radar-iran --file=service/schema.sql --remote
   ```
4. Deploy:
   ```bash
   npx wrangler deploy --config service/wrangler.toml
   ```
5. In Radar Iran → «رادار من» → «همگام‌سازی ابری», paste the deployed Worker URL and create an identity.

## Security model

The recovery key is a bearer credential. The Worker stores only its SHA-256 hash, but the browser must keep the original key locally to authenticate. Anyone with the recovery key can read or replace that profile's synced state.

CORS is open because the public static frontend can be hosted independently. The API does not expose market data or privileged repository access.

## API

- `GET /health`
- `POST /v1/profile` → creates an anonymous profile and returns a one-time recovery token
- `GET /v1/state` → bearer-authenticated synced state
- `PUT /v1/state` → bearer-authenticated state replacement
- `POST /v1/push-subscription` → store a browser PushSubscription for future server-side push
- `DELETE /v1/push-subscription`

## Not implemented yet

Actual background Web Push delivery is not sent by this Worker yet. v9 stores the subscription and establishes the authenticated service layer; a later alert dispatcher can evaluate market changes server-side and send pushes.
