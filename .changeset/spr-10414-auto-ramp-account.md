---
'@spritz-finance/api-client': minor
---

Add `client.autoRampAccount` for the REST auto-ramp account endpoints: virtual bank accounts in the user's name that convert fiat deposits to crypto.

```typescript
const account = await client.autoRampAccount.create({
    address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    network: 'solana',
    token: 'USDC',
})

const estimate = await client.autoRampAccount.estimate(account.id, '2525.00')
```

`create` does not support an idempotency key: after a timeout, call `list()` before creating again. `estimate` returns an estimate, not a quote; branch on `error.problem.code` when it fails.

This is the REST replacement for the legacy GraphQL `client.virtualAccounts`.

**New**

- `AutoRampAccountService`, reachable as `client.autoRampAccount`, with `list()`, `get(accountId)`, `create(input)` and `estimate(accountId, amount)`.
- `AutoRampAccount`, `AutoRampAccountList`, `CreateAutoRampAccountRequest` and `AutoRampAccountEstimate` types, derived from the generated contract.
