---
'@spritz-finance/api-client': minor
---

Add `client.sandbox.createDepositWithReturn` for simulating end-to-end ACH return handling in sandbox. Pass a NACHA return code (e.g. `R01`, `R10`) and the deposit's ACH debit is pre-armed to return with that code, surfacing in webhooks and `client.achDebitReturn.list()` like a real return. Also tighten the ACH onramp guide: hoist the server-side-only architecture note above the prerequisites, add a NACHA-verbatim compliance warning around the authorization message, fix the sandbox-demo open instructions to use a local HTTP server, and expand the deposit response field reference.
