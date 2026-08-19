# @spritz-finance/api-client

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
