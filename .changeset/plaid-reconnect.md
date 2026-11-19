---
'@spritz-finance/api-client': minor
---

Reconnect Plaid bank accounts in place.

- `connectionStatus` (`connected` | `expiring` | `reconnect_required` | `not_applicable`) on bank accounts and funding sources.
- `bankAccount.createLinkToken({ bankAccountId })` (or `fundingSourceId`) opens a reconnect; the bank account and funding source keep their IDs.
- `bankAccount.completeLinking({ ..., bankAccountId })` pins a Link SDK reconnect to that bank account. Picking a different account throws `ConflictError` with `problem.code === 'PLAID_ITEM_NOT_REPAIRABLE'`.

Regenerated from the current API, which also brings:

- Deposit preparation: `instantUnavailableReason` and problem reasons `bank_relink_required` / `temporarily_unavailable`.
- Typed `application/problem+json` error bodies on more routes.
- `messageVersion` drops `fomo_v3` and `fomo_v4`. The API no longer issues them.
