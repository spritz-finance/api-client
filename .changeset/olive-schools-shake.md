---
'@spritz-finance/api-client': minor
---

Add deposit read methods so integrators can reconcile deposits without a second REST client.

**New methods**

- `client.deposit.list(query?)` calls `GET /v1/deposits/` and returns the user-scoped page as-is (exported type `DepositListResponse`: `data`, `hasMore`, `nextCursor`). The query accepts the schema-defined `limit` and `cursor` (exported type `DepositListQuery`).
- `client.deposit.get(depositId)` calls `GET /v1/deposits/{depositId}` and returns the deposit as-is. `depositId` is encoded as a single path segment.

Both go through the existing REST infrastructure, so they inherit environment/base-URL handling, the per-user bearer key set by `setApiKey`, the integrator key, HMAC signing, `APIError`/`APIConnectionError` normalization and request/trace-ID propagation.

`Deposit` is now `PathResponse<'/v1/deposits/{depositId}', 'get'>` instead of the `POST /v1/deposits/direct` response. The two schemas are identical in the generated types, so the exported type is unchanged in practice.

**Fix**

REST query strings are now serialized with the same canonicalizer used for HMAC signing (sorted keys, `encodeURIComponent` percent-encoding) rather than `URLSearchParams`. `URLSearchParams` encodes a space as `+` while the signature covers `%20`, so any query parameter containing a space, `+`, or `'` produced a signature over a path that differed from the one transmitted. Affects every signed REST call that sends a query string.
