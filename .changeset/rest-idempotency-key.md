---
'@spritz-finance/api-client': minor
---

Send the `idempotency-key` header that `POST /v1/deposits/direct` and `POST /v1/sandbox/deposits/direct` require.

**Breaking:** `client.deposit.create(input, { idempotencyKey })` and `client.sandbox.createDepositWithReturn(input, { idempotencyKey })` now take a required second argument. Persist one unique key per deposit intent before calling `create`, and reuse the same key and body to recover the original response after a timeout instead of authorizing a second ACH debit. Calls without a key throw before any request is sent.

`restRoute(path, method, { headers })` and `client.restApi({ headers })` accept per-request headers, typed from the generated OpenAPI `parameters.header` for the route (required where the contract requires them, disallowed elsewhere).
