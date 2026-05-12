# @spritz-finance/api-client

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
