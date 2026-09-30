---
'@spritz-finance/api-client': minor
---

Add `client.offRampQuote.submit(quoteId, { transactionHash })` for `POST /v1/off-ramp-quotes/{quoteId}/submit`.

```typescript
const quote = await client.offRampQuote.submit(quote.id, { transactionHash })
```

Optional step: reports the broadcast transaction so the quote moves to `transaction_pending` and its off-ramp is created right away, instead of when the chain watcher notices it. Safe to retry with the same hash.

**New**

- `client.offRampQuote.submit(quoteId, input)`.
- `SubmitOffRampQuoteRequest` type, derived from the generated contract.
