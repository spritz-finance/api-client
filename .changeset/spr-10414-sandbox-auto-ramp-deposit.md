---
'@spritz-finance/api-client': minor
---

Add `client.sandbox.simulateAutoRampDeposit(accountId, { amount, ... })` for `POST /v1/sandbox/auto-ramp-accounts/{id}/deposit`.

```typescript
const { onRampId, status } = await client.sandbox.simulateAutoRampDeposit(accountId, {
    amount: '2525.00',
})
```

This is the only way to make an auto-ramp account settle in sandbox. The on-ramp it produces is an ordinary one: follow `onRampId` with `client.onrampPayment.get()`. Returns 403 in production.

**New**

- `client.sandbox.simulateAutoRampDeposit(accountId, input)`.
- `SimulateAutoRampDepositRequest` and `SimulateAutoRampDepositResponse` types, derived from the generated contract.
