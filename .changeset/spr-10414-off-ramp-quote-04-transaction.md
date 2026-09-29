---
'@spritz-finance/api-client': minor
---

Add `client.offRampQuote.getTransaction(quoteId, input?)` for `POST /v1/off-ramp-quotes/{quoteId}/transaction`.

```typescript
const transaction = await client.offRampQuote.getTransaction(quote.id, {
    senderAddress: wallet.publicKey.toBase58(),
})
```

Returns the transaction to sign for a `sign_transaction` quote: EVM calldata, or a serialized Solana or Sui transaction; branch on `type`. Pass `senderAddress` on Solana and Sui. `feePayer` is Solana only.

**New**

- `client.offRampQuote.getTransaction(quoteId, input?)`.
- `OffRampQuoteTransactionRequest` and `OffRampQuoteTransaction` types, derived from the generated contract.
