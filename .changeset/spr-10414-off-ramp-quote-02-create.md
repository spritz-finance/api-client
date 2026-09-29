---
'@spritz-finance/api-client': minor
---

Add `client.offRampQuote.create(...)` for `POST /v1/off-ramp-quotes/`.

```typescript
const quote = await client.offRampQuote.create({
    accountId: bankAccount.id,
    amount: '100.00',
    amountMode: 'input',
    chain: 'base',
    tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
})
```

Check `quote.fulfillment` for the next step. EUR destinations require `amountMode: 'input'`; the quote's `output.amount` is then an estimate. `tokenAddress` is required on every chain except Bitcoin and Dash. The endpoint does not support an idempotency key, so a retry creates a second quote.

**New**

- `client.offRampQuote.create(input)`.
- `CreateOffRampQuoteRequest` and `OffRampQuote` types, derived from the generated contract.
