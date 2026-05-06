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
- Signal simulation support, if added

Open scope questions:

- What exact Signal fixture should represent partner-facing "medium risk": a Plaid ruleset `review` outcome, or an accepted score below Spritz's local block threshold?

Confirmed product behavior:

- Plaid Signal runs during `client.deposit.create(...)`, after the user confirms the ACH authorization and before Spritz initiates the ACH pull.
- A blocked/rerouted Signal result must return a clean 409 error and must not create or submit an ACH debit.
- Signal `review` maps to `risk_review_required`; `reject`, `reroute`, and local-threshold blocks map to `risk_rejected`; unavailable/insufficient data maps to `risk_evaluation_unavailable`.
- A blocked create attempt consumes the preparation. The partner must prepare a new quote after resolving the issue, not retry the same `preparationId`.

Known API gaps to resolve before sign-off:

- Signal simulation is partner-release scope and should use the sandbox `signal` selector. The SDK/OpenAPI contract in this worktree must be refreshed or extended so `client.sandbox.createDepositWithReturn(...)` accepts it with strong types.
- The generated webhook event enum currently exposes legacy account/payment/capability events only. Platform emits internal ACH events such as `deposit.created`, `deposit.updated`, `deposit-return.created`, and `deposit-return.updated`, but this repo does not show a public webhook subscription/delivery contract for those ACH events. Confirm whether legacy `payment.*` events are the intended public mapping, or update the backend/OpenAPI contract before E2E webhook certification.

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
- Signal simulation should be exposed as `signal` on the sandbox create payload.
- The current generated SDK types only show `returnSimulation`, so SDK contract work is still required before sign-off.

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
| Webhooks         | Receive deposit event                       | Public webhook event for the ACH/on-ramp lifecycle is delivered after sandbox deposit creation             | Sandbox run                                                        |
| Webhooks         | Receive return event                        | Public webhook event for ACH return handling is delivered after sandbox return simulation                  | Sandbox run                                                        |
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

Recommended sandbox API design:

```typescript
await client.sandbox.createDepositWithReturn({
    preparationId,
    signal: { outcome: 'reroute' },
})
```

Keep Signal simulation separate from return simulation because Signal happens before debit initiation and returns happen after debit initiation.

If combined simulations are needed for end-to-end cases, make the ordering explicit:

```typescript
await client.sandbox.createDepositWithReturn({
    preparationId,
    signal: { outcome: 'accept' },
    returnSimulation: { code: 'R01' },
})
```

Do not expose Plaid sandbox magic amounts as the partner workflow. They can be used internally to validate Signal rules, but partner-facing simulation should describe business outcomes such as `accept`, `review`, and `reroute`.

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

1. Create or select a test user.
2. Bypass KYC with `client.sandbox.bypassKyc({ country: 'US' })`.
3. Create Plaid link token.
4. Complete Plaid Link with sandbox credentials.
5. Poll funding sources until an `active` source exists.
6. Fetch deposit limits with `client.fundingSource.getDepositLimits(source.id)`.
7. Start a real HTTPS webhook receiver that records raw body, headers, and parsed payload.
8. Set webhook secret with `client.webhook.updateWebhookSecret(...)`.
9. Register webhook with `client.webhook.create(...)`.
10. Confirm webhook appears in `client.webhook.list()`.
11. Prepare low-risk deposit.
12. Verify quote fields and authorization message.
13. Create low-risk deposit.
14. Confirm on-ramp appears in `client.onrampPayment.list()`.
15. Fetch on-ramp by ID.
16. Confirm webhook receiver gets the expected deposit/on-ramp lifecycle event.
17. Verify webhook signature against the raw request body.
18. Run medium-risk Signal scenario and verify policy behavior.
19. Run high-risk Signal scenario and verify no ACH debit is initiated.
20. Run Signal timeout/unavailable/null-score scenarios if sandbox supports them.
21. Simulate `R01` return.
22. Simulate `R10` return.
23. Simulate `R29` return.
24. Confirm each return appears in `client.achDebitReturn.list()`.
25. Fetch each return by ID.
26. Confirm webhook receiver gets expected return-related events.
27. Verify return filters and pagination.
28. Delete the webhook and verify it no longer appears in `client.webhook.list()`.
29. Capture request IDs, deposit IDs, on-ramp IDs, return IDs, webhook IDs, received event payloads, and relevant screenshots/log excerpts.

## Documentation Review

Review these before sign-off:

- `README.md`
- `docs/ach-onramp-guide.md`
- `scripts/sandbox/ach-onramp.html`
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

| Gate                          | Status  | Evidence                                                           |
| ----------------------------- | ------- | ------------------------------------------------------------------ |
| Automated checks              | Pending |                                                                    |
| ACH contract tests            | Pending |                                                                    |
| Error surfacing tests         | Pending |                                                                    |
| Funding source deposit limits | Pending |                                                                    |
| Signal simulations            | Pending | Wire/verify sandbox `signal` selector in SDK contract              |
| Webhook E2E                   | Blocked | Public ACH webhook event mapping not confirmed in platform/OpenAPI |
| Live sandbox happy path       | Pending |                                                                    |
| Live sandbox return paths     | Pending |                                                                    |
| Docs review                   | Pending |                                                                    |
| API gaps resolved/excluded    | Pending |                                                                    |

Final release decision:

- Decision: Pending
- Owner:
- Date:
- Notes:
