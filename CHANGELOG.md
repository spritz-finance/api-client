# @spritz-finance/api-client

## 0.18.1

### Patch Changes

- 9e99f84: Expose deterministic ACH-debit program controls, exposure caps, and bank-account linking through the sandbox service.

## 0.18.0

### Minor Changes

- a7b359d: Add `client.achDebit.checkEligibility({ email })` for the new `POST /v1/ach-debit/eligibility` endpoint.

  ```typescript
  const { eligible } = await client.achDebit.checkEligibility({
    email: "user@example.com",
  });
  ```

  Ask before showing a bank deposit option to someone who is not yet a Spritz user. The route authenticates as the integrator over HMAC and takes no user bearer key, because the address it asks about need not belong to an existing user. Eligibility only moves in one direction — once an address is eligible it stays eligible — so `eligible: false` may be transient and should be re-checked rather than cached. Once the user exists, `client.user.getUserAccess()` is the source of truth.

  **New**

  - `AchDebitService`, reachable as `client.achDebit`.
  - `AchDebitEligibilityRequest` and `AchDebitEligibilityResponse` types, both derived from the generated contract.

  **Also in this release**, from regenerating the REST types: `messageVersion` on the `deposit.prepare` response widens from `'v1'` to `'v1' | 'fomo_v1'`. Spritz picks the authorization template server-side from the integrator; clients cannot request one and should keep displaying `message` verbatim. Code that assigned `messageVersion` to a `'v1'`-typed variable will need to widen it.

## 0.17.0

### Minor Changes

- 52d02e3: Expose RFC 9457 problem details on `APIError` as a typed, normalized `problem` property, so consumers can branch on the problem type instead of inspecting an untyped payload.

  ```typescript
  import { hasProblemType } from "@spritz-finance/api-client";

  try {
    await client.deposit.create(input, options);
  } catch (error) {
    if (hasProblemType(error, "urn:problem-type:idempotency-conflict")) {
      // The same idempotency key was used with a different request body.
    }

    throw error;
  }
  ```

  **New**

  - `ProblemDetails`, `ProblemFieldError` and `ProblemSuggestedAction` types, modelling every field the contract documents on a problem response: `type`, `title`, `status`, `detail`, `instance`, `code`, `field`, `errors[]`, `retryable`, `retryAfter`, `suggestedAction`, `clearsAt`, `availableAt`, `permanent`, plus `realm`/`scope` (some 401s) and `resourceType`/`resourceId` (404s). Anything else the API sends stays readable on `error`.
  - `APIError.problem?: ProblemDetails`, parsed from the response body.
  - `APIError.requestId?: string` and `APIError.traceId?: string`, lifted from the `x-amzn-requestid` and `x-amzn-trace-id` headers.
  - Type guards `isAPIError`, `hasProblemType` and `hasProblemCode`. The latter two narrow `problem.type` / `problem.code` to the literal passed in.

  The payload is untrusted, so it is validated at runtime with no new dependency: a field appears on `problem` only when the response carried it with its documented type, each `errors[]` entry is validated individually, and documented nulls (`clearsAt`, `availableAt`) are preserved as distinct from absence. Inherited properties are ignored, so a polluted prototype cannot add a field the response never sent. A malformed error body never throws — it just yields fewer fields, or no `problem` at all.

  **Additive.** `error` still holds the untouched parsed payload, including fields `ProblemDetails` does not model, and `headers` still holds the correlation ids. The status subclasses and transport errors are unchanged, and no class was added per problem code.

  The SDK exposes upstream problem details faithfully, including `detail`, which is written for integrators rather than end users. Deciding what is safe to forward to a frontend remains the consumer's call at its own boundary.

## 0.16.0

### Minor Changes

- 56f59ab: Regenerate REST types for the ACH submission contract, so integrators can send the fields `POST /v1/deposits/direct` now requires.

  **Action required for integrator backends.** `POST /v1/deposits/direct` now rejects a backend create over integrator HMAC auth unless the body carries `clientIp` — the public address your edge observed for the authorizing client, distinct from your backend's own address. Until this release the generated types gave callers no way to send it, so `client.deposit.create()` fails against the updated API:

  ```typescript
  const deposit = await client.deposit.create(
    { preparationId: preparation.preparationId, clientIp: req.ip },
    { idempotencyKey }
  );
  ```

  `clientIp` is typed optional because the route accepts three authentication modes and only the backend-integrator one requires it — a plain user bearer (Cognito JWT or `ak_` key) submits without it. So that the omission cannot reach the API, `create` now throws before sending when the client is configured with integrator HMAC credentials and `clientIp` is missing. `SpritzClient` exposes `usesIntegratorAuth` to make that distinction.

  **Direct client submission.** `deposit.prepare()` accepts `clientNetwork: { ipAddresses }` and its response now carries `submissionToken`, a short-lived preparation-bound capability to forward to the authorizing client. That client submits `POST /v1/deposits/direct` itself with the token as its credential; it is not a request this SDK can make. Integrator JWT is no longer accepted on `create` (it cannot bind the claimed `clientIp`) and remains valid on `prepare` and the deposit read methods.

  The regeneration is additive — no fields were removed from any type an existing method uses. It also adds `POST /v1/connect/sessions/{sessionId}/return` to the REST contract, which the SDK does not yet wrap.

## 0.15.0

### Minor Changes

- 306c736: Add deposit read methods so integrators can reconcile deposits without a second REST client.

  **New methods**

  - `client.deposit.list(query?)` calls `GET /v1/deposits/` and returns the user-scoped page as-is (exported type `DepositListResponse`: `data`, `hasMore`, `nextCursor`). The query accepts the schema-defined `limit` and `cursor` (exported type `DepositListQuery`).
  - `client.deposit.get(depositId)` calls `GET /v1/deposits/{depositId}` and returns the deposit as-is. `depositId` is encoded as a single path segment.

  Both go through the existing REST infrastructure, so they inherit environment/base-URL handling, the per-user bearer key set by `setApiKey`, the integrator key, HMAC signing, `APIError`/`APIConnectionError` normalization and request/trace-ID propagation.

  `Deposit` is now `PathResponse<'/v1/deposits/{depositId}', 'get'>` instead of the `POST /v1/deposits/direct` response. The two schemas are identical in the generated types, so the exported type is unchanged in practice.

  **Fix**

  REST query strings are now serialized with the same canonicalizer used for HMAC signing (sorted keys, `encodeURIComponent` percent-encoding) rather than `URLSearchParams`. `URLSearchParams` encodes a space as `+` while the signature covers `%20`, so any query parameter containing a space, `+`, or `'` produced a signature over a path that differed from the one transmitted. Affects every signed REST call that sends a query string.

## 0.14.0

### Minor Changes

- 0d36f01: Regenerate REST types from the live sandbox spec for verification retry support: `UserProfile.verification` gains `failureReason`, `provider` (`persona` | `plaid`) and the `under_review` status, and `sandbox.bypassKyc({ failed: true, retryable })` can arm a retryable failure.

## 0.13.0

### Minor Changes

- a9584df: Send the `idempotency-key` header that `POST /v1/deposits/direct` and `POST /v1/sandbox/deposits/direct` require.

  **Breaking:** `client.deposit.create(input, { idempotencyKey })` and `client.sandbox.createDepositWithReturn(input, { idempotencyKey })` now take a required second argument. Persist one unique key per deposit intent before calling `create`, and reuse the same key and body to recover the original response after a timeout instead of authorizing a second ACH debit. Calls without a key throw before any request is sent.

  `restRoute(path, method, { headers })` and `client.restApi({ headers })` accept per-request headers, typed from the generated OpenAPI `parameters.header` for the route (required where the contract requires them, disallowed elsewhere).

## 0.12.0

### Minor Changes

- 3c3f77a: Add REST user profile and verification session methods, and regenerate the REST types from the sandbox OpenAPI schema.

  **New methods**

  - `client.user.getMe()` calls `GET /v1/users/me` and returns the REST profile as-is (exported type `UserProfile`), including `verification` (`status`, `country`, optional `requirement`) and `capabilities`.
  - `client.verification.createSession()` calls `POST /v1/users/me/verification-sessions/` and returns the session as-is (exported type `VerificationSession`: `sessionId`, `provider`, `sessionToken`, `verificationUrl`, `verificationUrlExpiresAt`).

  The GraphQL methods `user.getCurrentUser()`, `user.getVerificationParams()` and `user.retryFailedVerification()` are unchanged and not deprecated: the REST profile has no verification failure reason, maps verifications under review to `not_started`, and has no retry endpoint yet.

  **Regenerated REST types**

  The checked-in REST types had drifted from the live API (the production and sandbox OpenAPI schemas match). The regeneration adds types for new endpoints (for example `POST /v1/off-ramp-quotes/{quoteId}/submit`, `GET /v1/deposits/`, `POST /v1/sandbox/bank-accounts/link`) and new webhook event names (`offramp.*`, `achDebit.*`, `onrampCredit.*`). The API responses themselves are unchanged by this release, but types used by existing methods now describe what the API already returns, so code reading removed fields will stop compiling:

  - `deposit.prepare()` / `deposit.create()` / `sandbox.createDepositWithReturn()`: the `clientContext` request field is gone; the fee quote replaces `planAdjustmentBps` / `planAdjustmentFeeUsd` with `instantPortionUsd`, `settlementPortionUsd`, `regularPublishedFeeUsd`, `instantPublishedFeeUsd` and adds `requestedPriority`; `integratorPricingClass`, `integratorPlanPhase`, `integratorPolicyVersion` and `exposureAmountUsd` are removed from the deposit.
  - `sandbox.createDepositWithReturn()`: `returnSimulation` is now optional and its `code` is a union of NACHA return codes (was `string`); `riskSimulation` and `lifecycleSimulation` were added.
  - `fundingSource.getDepositLimits()`: `dailyLimitUsd`, `dailyRemainingUsd`, `monthlyLimitUsd`, `monthlyRemainingUsd`, `unsettledDepositLimit`, `unsettledDepositRemaining` and `exposure` are removed; `maxPortionUsd` is replaced by `maxAmountUsd` and `maxEarlyReleaseAmountUsd`.
  - `fundingSource.list()` / `fundingSource.get()`: `disabledReason` and `ownershipMatchStatus` are removed.
  - Additive only: `quoteId` on refunded off-ramps, `depositId` on on-ramps, and the wider webhook event list.

## 0.11.0

### Minor Changes

- 23e1139: Regenerate the REST types from the sandbox OpenAPI schema. This contains two breaking type changes.

  **1. Bank account `status` narrowed to `'active' | 'inactive'`.**

  The API no longer returns `'pending'` or `'rejected'` for `GET /v1/bank-accounts/`, `POST /v1/bank-accounts/`, or `GET /v1/bank-accounts/{accountId}`. Code branching on either removed value will no longer compile. Funding sources are unaffected — they keep their own `status` union (`pending | active | review_required | ineligible | disabled | deleted`).

  **2. IBAN bank account creation has new required request fields.**

  On `POST /v1/bank-accounts/` with `type: 'iban'`:

  - `bic` is now required (was optional) — affects every IBAN account creation.
  - `accountHolder.address` is now required (was optional), as is its `country`. This only applies when you pass `accountHolder`, which itself remains required only for `ownership: 'thirdParty'`.

  The endpoint already documented both as required for IBAN accounts; the types now enforce it. Callers omitting them were getting runtime 400s that the types allowed.

  Also relaxed in the same variant: `accountHolder.address.state` is now optional (was required), and an optional `bankName` was added.

## 0.10.0

### Minor Changes

- b06198f: Failed off-ramps can now be refunded via the new `client.offramp.refund(offRampId, input)`. Pass `{ method: 'account', accountId }` to reissue the payout to a different bank account, omit `accountId` to reuse the off-ramp's original destination, or pass `{ method: 'credit' }` to return the funds to the user's Spritz balance. Only failed Modern Treasury and Checkbook off-ramps are refundable. Regenerated REST types against the platform OpenAPI spec, which also picks up `PATCH /v1/debit-cards/{cardId}/cardholder-info`.

## 0.9.0

### Minor Changes

- e17ecbb: On-ramps now expose the funding source they originated from: `onrampPayment.list`/`get` responses include a `source` object (`{ fundingSourceId }`) for ACH-debit on-ramps, or `null` for externally pushed funds (ach_credit, wire, sepa). Deposits expose `onRampId` linking to the on-ramp created for them. Funding sources gain a `deletedAt` timestamp and a `"deleted"` status — removed funding sources stay retrievable by id for historical reference. Regenerated REST types against the platform OpenAPI spec.

## 0.8.3

### Patch Changes

- d2acd5c: Add `client.sandbox.deleteFundingSource(fundingSourceId)` for permanently removing an ACH debit funding source while integration testing. Like the other sandbox helpers it is only available in sandbox environments — returns 403 in production. Regenerated REST types against the platform OpenAPI spec.
- 7e4f7f6: Centralize typed REST route construction so SDK modules share path parameter encoding, query serialization, and generated OpenAPI response inference without changing public method behavior.

## 0.8.2

### Patch Changes

- 767dc00: Funding sources now expose an `institution` field with branding metadata (`name`, `logoUrl`, `primaryColor`) alongside the existing `institutionName`. The flat `institutionName` is deprecated — prefer `institution.name` going forward. Regenerated REST types against the platform OpenAPI spec.

## 0.8.1

### Patch Changes

- f9fbb4d: Surface optional `redirectUri` on `bankAccount.createLinkToken` for Plaid OAuth flows. Pass a URL (web), universal link (iOS), or package name (Android) to receive a Plaid Link token configured for OAuth redirect handling.

## 0.8.0

### Minor Changes

- ed47596: Migrate `client.bankAccount` to the REST API so bank account records expose `fundingSourceId`, the canonical signal for ACH on-ramp eligibility.

  - `bankAccount.list()`, `bankAccount.create()`, and `bankAccount.delete()` now call REST `/v1/bank-accounts/` instead of GraphQL.
  - New `bankAccount.get(id)` returns a single bank account.
  - The list/create response shape changes to match the REST contract: `label` (was `name`), `accountNumberLast4`, `routingNumberLast4`, region-specific `type` (`us` / `ca` / `uk` / `iban`), `supportedRails`, and `fundingSourceId`. Removed fields: `userId`, `email`, `ownedByUser`, `paymentAddresses`, full `accountNumber`, GraphQL-only `bankAccountType`/`bankAccountSubType`/`deliveryMethods`.
  - `bankAccount.create()` input switches to the REST body (`type`, `ownership`, region-specific fields, optional `accountHolder` for `thirdParty`) and no longer requires the previous `subType`/`details` GraphQL shape.
  - `bankAccount.rename()` is removed; the REST API has no equivalent.
  - `completeLinking()` now returns the full REST envelope `{ bankAccounts: [...] }` with the same per-account shape as `list()`.
  - ACH on-ramp guide updated: treat `bankAccount.list()` as the canonical list and use `fundingSourceId` to detect on-ramp eligibility. Bank accounts without a `fundingSourceId` remain usable for off-ramp.

## 0.7.0

### Minor Changes

- 1b3c50a: Expose the full partner-facing ACH debit release surface: funding-source deposit limits, RFC 7807 error messages, sandbox ACH return simulation, webhook event updates, and SDK-backed QC evidence tooling.

  Add typed webhook subscription updates via `client.webhook.update(webhookId, { events })`, including support for ACH on-ramp events, ACH debit return events, and `'*'` for all webhook events.

- 84704ec: Add `client.sandbox.createDepositWithReturn` for simulating end-to-end ACH return handling in sandbox. Pass a NACHA return code (e.g. `R01`, `R10`) and the deposit's ACH debit is pre-armed to return with that code, surfacing in webhooks and `client.achDebitReturn.list()` like a real return.

  Add `client.onrampPayment.get(onRampId)` for fetching a single on-ramp record. Once a deposit is authorized it is observed via the on-ramp model — this completes the lookup pair alongside `list`.

  Tighten the ACH onramp guide: hoist the server-side-only architecture note above the prerequisites, add a NACHA-verbatim compliance warning around the authorization message, fix the sandbox-demo open instructions to use a local HTTP server, expand the deposit response field reference, and add a "Track Deposit Status" section explaining the on-ramp lookup pattern.

### Patch Changes

- 5a0ef33: Revert `client.bankAccount.list()` to the `UserBankAccounts` GraphQL query. The REST `/v1/bank-accounts/` payload omits `userId`, `institution.id`, `institution.country`, `email`, `ownedByUser`, and `paymentAddresses`, and the previous shim filled those slots with empty strings and hardcoded values, silently changing the contract for existing consumers. Restoring the GraphQL path keeps the returned shape identical to prior releases.

## 0.6.0

### Minor Changes

- e867e23: Switch ACH onramp to the new no-signature direct-deposit flow. `client.deposit.prepare` and `client.deposit.create` now hit `/v1/deposits/direct/prepare` and `/v1/deposits/direct`: `prepare` takes the destination wallet `address` (plus `network`/`asset`) instead of a bound `destinationId`, and `create` takes only `preparationId` — wallet signatures are no longer required. The `client.depositDestination` service and its bind/sign endpoints have been removed.

  Add `client.achDebitReturn` for the integrator-scoped ACH return endpoints (`list`, `get`) at `/v1/integrator/ach-debit/returns`, with filtering by user, return code, reporting bucket, crypto state at return, loss, user action, and time range.

## 0.5.0

### Minor Changes

- Add ACH onramp services (funding sources, deposit destinations, deposits), Plaid bank linking methods, and sandbox KYC bypass. Switch bank account and onramp payment list endpoints from GraphQL to REST API.

## 0.4.28

### Patch Changes

- be2b4d4: Declare the package manager version in package metadata.
