---
'@spritz-finance/api-client': minor
---

Add `client.deposit.cancel(depositId)` for ACH debit deposits, with the `cancellable` and `cancelledAt` fields on deposits, `cancellable` on on-ramps, and the `cancelled` deposit status. Document the `ach_debit_cancel_cooldown` error and its `availableAt`.
