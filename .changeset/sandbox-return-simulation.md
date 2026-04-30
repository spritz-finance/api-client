---
'@spritz-finance/api-client': minor
---

Add `client.sandbox.createDepositWithReturn` for simulating end-to-end ACH return handling in sandbox. Pass a NACHA return code (e.g. `R01`, `R10`) and the deposit's ACH debit is pre-armed to return with that code, surfacing in webhooks and `client.achDebitReturn.list()` like a real return.

Add `client.onrampPayment.get(onRampId)` for fetching a single on-ramp record. Once a deposit is authorized it is observed via the on-ramp model — this completes the lookup pair alongside `list`.

Tighten the ACH onramp guide: hoist the server-side-only architecture note above the prerequisites, add a NACHA-verbatim compliance warning around the authorization message, fix the sandbox-demo open instructions to use a local HTTP server, expand the deposit response field reference, and add a "Track Deposit Status" section explaining the on-ramp lookup pattern.
