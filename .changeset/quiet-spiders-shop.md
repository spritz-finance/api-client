---
'@spritz-finance/api-client': minor
---

Regenerate REST types for the ACH submission contract, so integrators can send the fields `POST /v1/deposits/direct` now requires.

**Action required for integrator backends.** `POST /v1/deposits/direct` now rejects a backend create over integrator HMAC auth unless the body carries `clientIp` — the public address your edge observed for the authorizing client, distinct from your backend's own address. Until this release the generated types gave callers no way to send it, so `client.deposit.create()` fails against the updated API:

```typescript
const deposit = await client.deposit.create(
    { preparationId: preparation.preparationId, clientIp: req.ip },
    { idempotencyKey }
)
```

`clientIp` is typed optional because the route accepts three authentication modes and only the backend-integrator one requires it — a plain user bearer (Cognito JWT or `ak_` key) submits without it. So that the omission cannot reach the API, `create` now throws before sending when the client is configured with integrator HMAC credentials and `clientIp` is missing. `SpritzClient` exposes `usesIntegratorAuth` to make that distinction.

**Direct client submission.** `deposit.prepare()` accepts `clientNetwork: { ipAddresses }` and its response now carries `submissionToken`, a short-lived preparation-bound capability to forward to the authorizing client. That client submits `POST /v1/deposits/direct` itself with the token as its credential; it is not a request this SDK can make. Integrator JWT is no longer accepted on `create` (it cannot bind the claimed `clientIp`) and remains valid on `prepare` and the deposit read methods.

The regeneration is additive — no fields were removed from any type an existing method uses. It also adds `POST /v1/connect/sessions/{sessionId}/return` to the REST contract, which the SDK does not yet wrap.
