# ACH Debit Release QC Plan

## Goal

Prove the ACH debit SDK flow is ready for a paying partner to integrate, use, and debug without Spritz hand-holding.

This plan covers:

- Functional correctness across the full ACH debit lifecycle
- SDK contract quality and type safety
- Clean partner-facing error behavior
- Plaid Signal risk-scoring behavior before debit initiation
- Sandbox evidence for happy paths, blocked paths, and return paths
- Documentation readiness

## Release Gate

Do not sign off until every item below is either complete or explicitly excluded with a named owner and reason.

- `yarn agent:check` passes.
- ACH SDK contract tests exist and pass.
- Error surfacing tests exist and pass for RFC 7807 responses.
- Live sandbox certification is complete.
- Funding source deposit limits are exposed through the SDK and verified in sandbox.
- Plaid Signal low, medium, high, unavailable, and null-score paths are covered.
- Webhook setup, signing, delivery, and cleanup are verified end-to-end.
- ACH return simulations are covered for at least `R01`, `R10`, and `R29`.
- Partner docs/examples compile and match the SDK.
- Any backend/API gaps are closed or called out as non-release scope.

## Findings To Carry Into Sign-Off

These are the concrete things identified during QC and must stay visible until release:

- The partner will consume ACH debit through the generated SDK. REST parity is useful for debugging, but release sign-off is based on SDK behavior, SDK error classes, SDK types, and SDK docs.
- The flow is intentionally small: create/link bank account, choose an `active` funding source, fetch limits, prepare, show authorization text, create, then track by webhook plus `onrampPayment`/`achDebitReturn`.
- `GET /v1/funding-sources/{id}/deposit-limits` must be exposed by the SDK and verified in sandbox before release.
- Plaid Signal is not a public request field. It runs after user confirmation during `client.deposit.create(...)`, before Spritz submits the ACH pull.
- Plaid Signal sandbox simulation is amount-driven. The SDK must not invent a `signal` field that is not in the OpenAPI contract.
- Error quality is release-critical. The SDK must surface clear subclasses, status codes, problem details, request IDs, and actionable messages.
- Webhook setup is part of partner release scope. Polling through `onrampPayment` and `achDebitReturn` is required for reconciliation, but not enough for the production integration.
- ACH webhook public event scope is `onramp.created`, `onramp.updated`, `onramp.completed`, `achDebitReturn.created`, `achDebitReturn.updated`, and `*` for all events. Internal event names may be transformed, but the consumer-facing webhook contract must not break.
- Return simulation is post-authorization and sandbox-only. It should use `client.sandbox.createDepositWithReturn(...)`, not a normal create call.
- Current staging blocker found on 2026-05-07: authorized ACH deposits are not auto-progressing because `DepositCreatedSubscriber` and `DepositExecutionLoop` crash on an unlinked `PlaidWebhookUrl` resource at startup. This does not mean ACH requires Plaid webhooks; it is a platform configuration/layer-coupling bug that must be fixed and redeployed before webhook/settlement certification.
- Webhook E2E was manually verified for non-return events in staging on 2026-05-07. Return webhook receipt still needs explicit confirmation after a simulated return.
- R01 return simulation was verified through the SDK on 2026-05-08: deposit `dep_01KR3DBTDDFEZ8FBMC0EVQVVH0`, return `dr_01KR3DDAQYERAAMWXMCT32RBBE`, on-ramp `69fda76d13a0c32a6571c786`, source `fs_01KR16ZM37E2JTBC19P8RXFV8R` disabled with reason `returned`.
- Potential API gap found on 2026-05-08: `client.achDebitReturn.list({ search: depositId })` returned no rows for public deposit ID `dep_01KR3DBTDDFEZ8FBMC0EVQVVH0`, but `client.achDebitReturn.list({ returnCode: 'R01' })` returned the matching return. Confirm whether `search` should support public deposit IDs and fix if yes.

## Scope

Partner-facing SDK surface:

- `client.bankAccount.createLinkToken()`
- `client.bankAccount.completeLinking(...)`
- `client.fundingSource.list()`
- `client.fundingSource.get(id)`
- `client.fundingSource.getDepositLimits(id)`
- `client.deposit.prepare(...)`
- `client.deposit.create(...)`
- `client.onrampPayment.list(...)`
- `client.onrampPayment.get(id)`
- `client.achDebitReturn.list(...)`
- `client.achDebitReturn.get(id)`
- `client.sandbox.bypassKyc(...)`
- `client.sandbox.createDepositWithReturn(...)`
- `client.webhook.create(...)`
- `client.webhook.updateWebhookSecret(...)`
- `client.webhook.list()`
- `client.webhook.delete(id)`
- `client.user.create(...)` or equivalent user creation path used by the example app to generate a sandbox user API key

Confirmed product behavior:

- Plaid Signal runs during `client.deposit.create(...)`, after the user confirms the ACH authorization and before Spritz initiates the ACH pull.
- A blocked/rerouted Signal result must return a clean 409 error and must not create or submit an ACH debit.
- Signal `review` maps to `risk_review_required`; `reject`, `reroute`, and local-threshold blocks map to `risk_rejected`; unavailable/insufficient data maps to `risk_evaluation_unavailable`.
- A blocked create attempt consumes the preparation. The partner must prepare a new quote after resolving the issue, not retry the same `preparationId`.
- Staging should automatically move accepted deposits through the async ACH lifecycle once the deposit is authorized. If a deposit remains `authorized` with no Modern Treasury submission, inspect the deposit execution subscribers before treating webhook delivery as the issue.

Known API gaps to resolve before sign-off:

- The generated webhook event enum must include the ACH partner events: `onramp.created`, `onramp.updated`, `onramp.completed`, `achDebitReturn.created`, `achDebitReturn.updated`, and `*`.
- Webhook payloads and endpoint behavior must remain backward compatible for existing consumers. If platform internal events differ, transform them before delivery rather than changing the public contract.
- Platform staging must be fixed so `DepositCreatedSubscriber` and `DepositExecutionLoop` can start without requiring unrelated Plaid webhook resource linkage.

## Backend Contract Check

Verified against `~/dev/spritz/platform` on 2026-05-06.

Create order:

1. `client.deposit.create(...)` calls the direct create path.
2. Backend claims and marks the preparation used.
3. Backend evaluates Plaid Signal with `clientTransactionId = depositId`.
4. Backend persists the risk evaluation.
5. If Signal outcome is not `created`, backend returns 409 and no deposit row is inserted.
6. If Signal outcome is `created`, backend inserts the deposit with `debitStatus = authorized`.
7. Backend publishes `deposit.created`; async workers handle ACH submission and on-ramp sync.

Sandbox reality:

- `/v1/sandbox/deposits` and `/v1/sandbox/deposits/direct` support `returnSimulation.code`.
- Signal sandbox behavior is exercised through Plaid amount fixtures; there is no public SDK `signal` field.

## QC Matrix

| Area             | Scenario                                    | Expected SDK/API Behavior                                                                                  | Required Evidence                                                  |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Client setup     | Missing `apiKey` and `integrationKey`       | Constructor throws clear credential error                                                                  | Unit test                                                          |
| Client setup     | `integratorSecret` without `integrationKey` | Constructor throws clear HMAC config error                                                                 | Unit test                                                          |
| Client setup     | Browser without `dangerouslyAllowBrowser`   | Constructor blocks secret exposure                                                                         | Unit test                                                          |
| Bank linking     | Create Plaid link token                     | Calls `POST /v1/bank-accounts/link-token`; returns `linkToken`, `hostedLinkUrl`, `expiration`              | Contract test                                                      |
| Bank linking     | Complete Plaid Link                         | Calls `POST /v1/bank-accounts/link-complete`; sends `publicToken`, `accountIds`, institution metadata      | Contract test + sandbox run                                        |
| Funding source   | List empty sources                          | Returns empty array; docs tell partner to link bank                                                        | Contract test                                                      |
| Funding source   | Pending source                              | SDK surfaces `pending`; partner should retry/poll                                                          | Contract test + docs                                               |
| Funding source   | Active source                               | SDK surfaces source usable for prepare                                                                     | Contract test + sandbox run                                        |
| Funding source   | Ineligible/review/disabled source           | Prepare/create does not proceed; error is clear                                                            | Contract test + sandbox/error test                                 |
| Funding source   | Get by ID with unsafe chars                 | ID is URL encoded                                                                                          | Contract test                                                      |
| Funding source   | Get deposit limits                          | Calls `GET /v1/funding-sources/{id}/deposit-limits`; exposes transaction, daily, monthly, unsettled limits | Contract test + sandbox run                                        |
| Deposit prepare  | Exact input quote                           | Sends expected body; returns `preparationId`, `message`, `summary`                                         | Contract test                                                      |
| Deposit prepare  | Exact output quote                          | Sends expected body; amount semantics documented                                                           | Contract test                                                      |
| Deposit prepare  | Fee subsidy                                 | Sends `feeSubsidy`; response exposes gross/user/subsidy fields                                             | Contract test                                                      |
| Deposit prepare  | Client context                              | Sends `clientContext` unchanged                                                                            | Contract test                                                      |
| Deposit prepare  | Invalid wallet                              | Throws clean validation/problem error                                                                      | Error test + sandbox/API check                                     |
| Deposit prepare  | Inactive funding source                     | Throws clean state/eligibility error                                                                       | Error test                                                         |
| Authorization    | ACH authorization message                   | Partner must display `message` verbatim before create                                                      | Docs review + sandbox screenshot                                   |
| Deposit create   | Happy path                                  | Calls `POST /v1/deposits/direct`; returns deposit lifecycle fields                                         | Contract test + sandbox run                                        |
| Deposit create   | Expired preparation                         | Throws clean expired preparation error                                                                     | Error test                                                         |
| Deposit create   | Reused preparation                          | Throws clean conflict/idempotency error                                                                    | Error test                                                         |
| Deposit create   | High-risk Signal                            | No ACH debit is initiated; SDK error is actionable                                                         | Signal simulation or documented backend fixture + sandbox evidence |
| On-ramp tracking | List on-ramps                               | Query params serialize correctly; pagination fields exposed                                                | Contract test + sandbox run                                        |
| On-ramp tracking | Get on-ramp                                 | ID is URL encoded; lifecycle fields documented                                                             | Contract test                                                      |
| Returns          | Simulate `R01`                              | Deposit reaches returned path; return record exists                                                        | Sandbox run                                                        |
| Returns          | Simulate `R10`                              | Unauthorized bucket/user action path covered                                                               | Sandbox run                                                        |
| Returns          | Simulate `R29`                              | Corporate unauthorized path covered                                                                        | Sandbox run                                                        |
| Returns          | List filters                                | `returnCode`, `returnBucket`, `lossOnly`, `userAction`, date bounds, pagination serialize correctly        | Contract test + sandbox run                                        |
| Returns          | Get return by ID                            | ID is URL encoded; return fields exposed                                                                   | Contract test                                                      |
| Webhooks         | Create webhook                              | Webhook can be registered for ACH-relevant public event names against a real HTTPS receiver                | Contract test + sandbox run                                        |
| Webhooks         | Configure secret                            | Webhook secret is configured before event testing                                                          | Contract test + sandbox run                                        |
| Webhooks         | Verify signature                            | Receiver validates HMAC signature using raw request body                                                   | Local receiver test + sandbox run                                  |
| Webhooks         | Receive on-ramp events                      | `onramp.created` and `onramp.updated` are delivered after sandbox deposit creation and lifecycle updates   | Sandbox run                                                        |
| Webhooks         | Receive return events                       | `achDebitReturn.created` and `achDebitReturn.updated` are delivered after sandbox return simulation        | Sandbox run                                                        |
| Webhooks         | List/delete webhook                         | Webhook appears in list and can be deleted during cleanup                                                  | Contract test + sandbox run                                        |
| Auth             | Bad bearer token                            | Throws `AuthenticationError` with clear message and IDs                                                    | Error test                                                         |
| Auth             | Missing/invalid HMAC                        | Throws clean auth/permission error                                                                         | Error test                                                         |
| Auth             | Feature disabled                            | Throws `PermissionDeniedError` with clear message                                                          | Error test                                                         |
| Reliability      | Timeout                                     | Throws `APIConnectionTimeoutError`                                                                         | Unit test                                                          |
| Reliability      | Network failure                             | Throws `APIConnectionError` with cause                                                                     | Unit test                                                          |
| Reliability      | 429                                         | Throws `RateLimitError` with clean retry context if provided                                               | Error test                                                         |
| Reliability      | 500                                         | Throws `InternalServerError`; request/trace IDs preserved                                                  | Error test                                                         |

## Plaid Signal QC

Signal is evaluated during deposit creation after user confirmation and before ACH debit initiation. A blocked or rerouted Signal result must not create or submit a debit.

Required behavior matrix:

| Signal Scenario                | Expected Product Behavior                                | Required Evidence             |
| ------------------------------ | -------------------------------------------------------- | ----------------------------- |
| Low risk                       | Deposit can be created normally                          | Simulation + sandbox run      |
| Medium risk                    | Behavior matches product policy exactly                  | Simulation + sandbox run      |
| High risk / reroute            | Deposit creation is blocked before ACH initiation        | Simulation or backend fixture |
| Signal timeout                 | Deterministic fallback; no ambiguous partial initiation  | Error/simulation test         |
| Signal unavailable             | 409 `risk_evaluation_unavailable`; no debit is initiated | Error/simulation test         |
| Null score / insufficient data | 409 `risk_evaluation_unavailable`; no debit is initiated | Error/simulation test         |
| Ruleset misconfigured          | Clean configuration error or unavailable-path response   | Error/simulation test         |

Sandbox Signal testing is amount-driven. The generated SDK must not expose a
`signal` request field because it is not in the public OpenAPI contract.

Use Plaid's sandbox amount fixtures:

| Amount  | Plaid Signal score | Expected Spritz use                                  |
| ------- | ------------------ | ---------------------------------------------------- |
| `3.53`  | `10`               | Low score; below current ACH minimum in this sandbox |
| `12.17` | `60`               | Medium score; expected allow under local threshold   |
| `27.53` | `90`               | High score; expected pre-debit risk block            |

Return simulation remains explicit and post-authorization:

```typescript
await client.sandbox.createDepositWithReturn({
    preparationId,
    returnSimulation: { code: 'R01' },
})
```

## Automated Test Plan

Add ACH-focused Vitest/MSW coverage.

Test files:

- `src/modules/bankAccount/bankAccountService.test.ts`
- `src/modules/fundingSource/fundingSourceService.test.ts`
- `src/modules/deposit/depositService.test.ts`
- `src/modules/onrampPayment/onrampPaymentService.test.ts`
- `src/modules/achDebitReturn/achDebitReturnService.test.ts`
- `src/modules/sandbox/sandboxService.test.ts`
- `src/modules/webhook/webhookService.test.ts`
- `src/lib/error.test.ts`
- optional compile-only type test for public exports

Coverage requirements:

- Correct method/path for each SDK call.
- Correct query serialization.
- Correct path encoding.
- Correct body passthrough.
- HMAC headers attached for signed REST calls.
- Request body is signed exactly as sent.
- Funding-source deposit limit response fields are available through public SDK types.
- Webhook create/list/delete/secret methods are covered by SDK tests.
- RFC 7807 errors produce clean `error.message` values.
- Error subclasses match HTTP status.
- Response headers preserve request/trace IDs.
- Public types are exported from `src/index.ts`.

## Error Quality Standard

Partner-facing errors should be concise, actionable, and classifiable.

Minimum standard:

- `error.name` maps to the HTTP class where possible.
- `error.status` is populated for HTTP errors.
- `error.message` prefers RFC 7807 `detail`, then `title`, then `message`, then a safe fallback.
- `error.error` preserves the parsed RFC 7807 payload for requirements, problem type, and partner support diagnostics.
- `error.headers.requestId` and `error.headers.traceId` are available when returned.
- Raw JSON stringification should not be the default partner experience.

Required error fixtures:

- 400 invalid input
- 401 missing/invalid bearer token
- 403 feature disabled
- 404 funding source not found
- 409 expired/reused preparation
- 422 invalid state, if emitted by API
- 429 rate limit
- 500 internal error
- non-JSON error response
- network failure
- timeout

## Live Sandbox Certification

Run this with real sandbox credentials and save evidence.

1. Generate a fresh sandbox user API key through the SDK/example app.
2. Before KYC bypass, call `client.bankAccount.createLinkToken()` and confirm the SDK throws `PermissionDeniedError` with status `403`, request IDs, and the identity-verification requirement body.
3. Bypass KYC with `client.sandbox.bypassKyc({ country: 'US' })`.
4. Retry `client.bankAccount.createLinkToken()` and confirm success.
5. Complete Plaid Link with sandbox credentials in the browser.
6. Poll `client.fundingSource.list()` until an `active` source exists.
7. Fetch `client.fundingSource.get(source.id)` and verify path encoding and source fields.
8. Fetch `client.fundingSource.getDepositLimits(source.id)` and verify transaction, daily, monthly, and unsettled-limit fields.
9. Start a real HTTPS webhook receiver that records raw body, headers, parsed payload, signature verification result, and receipt timestamp.
10. Set webhook secret with `client.webhook.updateWebhookSecret(...)`.
11. Register webhook with `client.webhook.create(...)` for `onramp.created`, `onramp.updated`, `achDebitReturn.created`, and `achDebitReturn.updated`.
12. Confirm webhook appears in `client.webhook.list()`.
13. Prepare a low/medium-risk deposit using the Plaid score `60` amount fixture.
14. Verify quote fields, fees, destination, limits snapshot if returned, and the full ACH authorization message.
15. Confirm in the UI, then create with `client.deposit.create(...)`.
16. Confirm the SDK response is clean and the deposit/on-ramp IDs are recorded.
17. Confirm `onramp.created` and `onramp.updated` are received and signature verification passes against the raw request body.
18. Confirm the on-ramp appears in `client.onrampPayment.list(...)`.
19. Fetch the on-ramp by ID with `client.onrampPayment.get(id)`.
20. Confirm the deposit leaves `authorized` and progresses through the staging async lifecycle after platform workers run.
21. Run high-risk Plaid Signal using the score `90` amount fixture and verify a clean 409, no ACH debit initiation, and no MT payment order.
22. Run Signal unavailable/null-score coverage if the sandbox fixture exists; otherwise record as excluded with platform owner and reason.
23. Simulate `R01` using `client.sandbox.createDepositWithReturn(...)`.
24. Simulate `R10` using `client.sandbox.createDepositWithReturn(...)`.
25. Simulate `R29` using `client.sandbox.createDepositWithReturn(...)`.
26. Confirm each return appears in `client.achDebitReturn.list(...)`.
27. Fetch each return by ID with `client.achDebitReturn.get(id)`.
28. Confirm `achDebitReturn.created` and `achDebitReturn.updated` are received and signature verification passes.
29. Verify return filters and pagination: `returnCode`, `returnBucket`, `lossOnly`, `userAction`, date bounds, `limit`, and `cursor`.
30. Delete the webhook and verify it no longer appears in `client.webhook.list()`.
31. Capture request IDs, deposit IDs, on-ramp IDs, return IDs, webhook IDs, received event payloads, signature results, evidence file names, and relevant log excerpts.

All live sandbox certification must run through the SDK. Raw REST calls are allowed only as parity checks when debugging an SDK failure.

## Documentation Review

Review these before sign-off:

- `README.md`
- `docs/ach-onramp-guide.md`
- `scripts/sandbox/ach-onramp.html`
- `qc/ach-debit-example-app-e2e.md`
- package public exports in `src/index.ts`

Docs must clearly state:

- SDK calls are server-side only.
- Integrator secret must never be sent to production clients.
- Plaid Link UI is client-side only.
- Funding source must be `active` before deposit prepare.
- Deposit limits should be fetched and handled before collecting final user authorization.
- Authorization message must be shown verbatim.
- Signal can block before ACH initiation.
- Return simulation is sandbox-only.
- Sandbox-only APIs return 403 in production.
- Webhook setup is part of the integration, with signature verification documented.

## Sign-Off Record

Complete this section when executing the plan.

| Gate                          | Status  | Evidence                                                         |
| ----------------------------- | ------- | ---------------------------------------------------------------- |
| Automated checks              | Pending |                                                                  |
| ACH contract tests            | Pending |                                                                  |
| Error surfacing tests         | Pending |                                                                  |
| Funding source deposit limits | Pending |                                                                  |
| Signal simulations            | Pending | Amount-driven Plaid sandbox fixtures; run sandbox evidence       |
| Webhook E2E                   | Partial | Non-return events verified; return webhook receipt still needed  |
| Live sandbox happy path       | Pending |                                                                  |
| Live sandbox return paths     | Partial | R01 verified via SDK on 2026-05-08; R10/R29 pending              |
| Docs review                   | Pending |                                                                  |
| API gaps resolved/excluded    | Pending | Webhook enum/events; staging `PlaidWebhookUrl` resource coupling |

Final release decision:

- Decision: Pending
- Owner:
- Date:
- Notes:
