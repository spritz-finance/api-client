---
'@spritz-finance/api-client': minor
---

Add `client.offRampQuote.get(quoteId)` for `GET /v1/off-ramp-quotes/{quoteId}`.

```typescript
const quote = await client.offRampQuote.get(quoteId)
```

Returns the same `OffRampQuote` shape as `create`. Use it to follow `status`, `confirmation` and `offRampId`.
