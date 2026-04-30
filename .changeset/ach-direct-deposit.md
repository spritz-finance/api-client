---
'@spritz-finance/api-client': minor
---

Switch ACH onramp to the new no-signature direct-deposit flow. `client.deposit.prepare` and `client.deposit.create` now hit `/v1/deposits/direct/prepare` and `/v1/deposits/direct`: `prepare` takes the destination wallet `address` (plus `network`/`asset`) instead of a bound `destinationId`, and `create` takes only `preparationId` — wallet signatures are no longer required. The `client.depositDestination` service and its bind/sign endpoints have been removed.

Add `client.achDebitReturn` for the integrator-scoped ACH return endpoints (`list`, `get`) at `/v1/integrator/ach-debit/returns`, with filtering by user, return code, reporting bucket, crypto state at return, loss, user action, and time range.
